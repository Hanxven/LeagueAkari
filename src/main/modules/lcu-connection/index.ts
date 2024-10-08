import {
  MobxBasedBasicModule,
  RegisteredSettingHandler
} from '@main/akari-ipc/mobx-based-basic-module'
import { UxCommandLine } from '@main/utils/ux-cmd'
import { SUBSCRIBED_LCU_ENDPOINTS } from '@shared/constants/subscribed-lcu-endpoints'
import { RadixEventEmitter } from '@shared/event-emitter'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import { Paths } from '@shared/utils/types'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import { set } from 'lodash'
import { comparer, computed, runInAction } from 'mobx'
import http from 'node:http'
import https from 'node:https'
import PQueue from 'p-queue'
import { WebSocket } from 'ws'

import { AppModule } from '../app'
import { LeagueClientModule } from '../league-client'
import { AppLogger, LogModule } from '../log'
import { MainWindowModule } from '../main-window'
import { LcuConnectionState } from './state'

export type LcuConnectionStateType = 'connecting' | 'connected' | 'disconnected'

/**
 * 与 LCU 客户端的连接模块，特例模块
 */
export class LcuConnectionModule extends MobxBasedBasicModule {
  public state = new LcuConnectionState()

  private _logger: AppLogger
  private _logModule: LogModule
  private _appModule: AppModule
  private _mwm: MainWindowModule
  private _lcm: LeagueClientModule

  static GAME_CLIENT_BASE_URL = 'https://127.0.0.1:2999'
  static INTERVAL_TIMEOUT = 12500
  static CLIENT_CMD_POLL_INTERVAL = 2000
  static CONNECT_TO_LCU_RETRY_INTERVAL = 750
  static PING_URL = '/riotclient/auth-token'
  static REQUEST_TIMEOUT_MS = 12500

  private _gcHttp = axios.create({
    baseURL: LcuConnectionModule.GAME_CLIENT_BASE_URL,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      maxFreeSockets: 1024,
      maxCachedSessions: 2048
    })
  })

  private _rcHttp: AxiosInstance | null = null

  private _clientPollTimerId: NodeJS.Timeout

  private _lcuHttp: AxiosInstance | null = null
  private _lcuWs: WebSocket | null = null

  private _lcuEventBus = new RadixEventEmitter()

  private _assetLimiter = new PQueue({ concurrency: 8 })

  get lcuHttp() {
    return this._lcuHttp
  }

  get gcHttp() {
    return this._gcHttp
  }

  get lcuEventBus() {
    return this._lcuEventBus
  }

  constructor() {
    super('lcu-connection')
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._appModule = this.manager.getModule<AppModule>('app')
    this._logger = this._logModule.createLogger('lcu-connection')
    this._mwm = this.manager.getModule<MainWindowModule>('main-window')
    this._lcm = this.manager.getModule<LeagueClientModule>('league-client')

    await this._setupSettings()
    this._setupStateSync()
    this._setupMethodCall()
    this._handleConnect()

    this._logger.info('初始化完成')
  }

  private async _poll() {
    try {
      this.state.setLaunchedClients(await this._lcm.getLaunchedClients())
    } catch (error) {
      this._mwm.notify.error('lcu-connection', '进程轮询', '在获取客户端进程信息时发生错误')
      this._logger.error(`获取客户端信息时失败 ${formatError(error)}`)
    }
  }

  private async _handleConnect() {
    const pollTiming = computed(() => {
      if (this.state.state === 'connected') {
        return 'stop-it!'
      }

      if (!this._appModule.state.isAdministrator && this._appModule.state.settings.useWmic) {
        return 'stop-it!'
      }

      return 'do-polling！'
    })

    this.reaction(
      () => pollTiming.get(),
      (state) => {
        if (state === 'stop-it!') {
          this.state.setLaunchedClients([])
          clearInterval(this._clientPollTimerId)
          return
        }

        this._poll()
        this._clientPollTimerId = setInterval(
          () => this._poll(),
          LcuConnectionModule.CLIENT_CMD_POLL_INTERVAL
        )
      },
      { fireImmediately: true }
    )

    this.reaction(
      () => this.state.connectingClient,
      (auth) => {
        if (!auth) {
          return
        }

        this._doConnectingLoop()
      }
    )

    // 自动连接 - 当客户端唯一时，自动连接到 LCU 客户端
    this.reaction(
      () => [this.state.settings.autoConnect, this.state.launchedClients] as const,
      async ([s, c]) => {
        if (s) {
          if (c.length === 1) {
            this.state.setConnectingClient(c[0])
          } else {
            this.state.setConnectingClient(null)
          }
        }
      }
    )

    this.reaction(
      () => [this.state.auth, this.state.state] as const,
      ([a, s]) => {
        if (a) {
          const { certificate, ...rest } = a
          this._logger.info(`LCU 状态发生变化: ${s} ${JSON.stringify(rest)}`)
        } else {
          this._logger.info(`LCU 状态发生变化: ${s} ${JSON.stringify(a)}`)
        }
      },
      { equals: comparer.shallow }
    )
  }

  private async _setupSettings() {
    this.registerSettings([
      {
        key: 'autoConnect',
        defaultValue: this.state.settings.autoConnect
      }
    ])

    const settings = await this.readSettings()
    runInAction(() => {
      settings.forEach((s) => set(this.state.settings, s.settingItem, s.value))
    })

    const defaultSetter: RegisteredSettingHandler = async (key, value, apply) => {
      runInAction(() => set(this.state.settings, key, value))
      await apply(key, value)
    }

    this.onSettingChange<Paths<typeof this.state.settings>>('autoConnect', defaultSetter)
  }

  private async _initWebSocket(auth: UxCommandLine) {
    this._lcuWs = new WebSocket(`wss://riot:${auth.authToken}@127.0.0.1:${auth.port}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.authToken}`).toString('base64')}`
      },
      protocol: 'wamp',
      rejectUnauthorized: false
    })
  }

  private async _initLcuHttpInstance(auth: UxCommandLine) {
    this._lcuHttp = axios.create({
      baseURL: `https://127.0.0.1:${auth.port}`,
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.authToken}`).toString('base64')}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
        maxCachedSessions: 2048,
        maxFreeSockets: 1024
      }),
      httpAgent: new http.Agent({
        keepAlive: true,
        maxFreeSockets: 1024
      }),
      timeout: LcuConnectionModule.REQUEST_TIMEOUT_MS,
      proxy: false
    })

    try {
      await this._lcuHttp.get(LcuConnectionModule.PING_URL)
    } catch (error) {
      if (isAxiosError(error) && (!error.response || (error.status && error.status >= 500))) {
        this._logger.warn(`无法执行 PING 操作: ${formatError(error)}`)

        throw new Error('http initialization PING failed')
      }
    }
  }

  private async _initRcHttpInstance(auth: UxCommandLine) {
    this._rcHttp = axios.create({
      baseURL: `https://127.0.0.1:${auth.riotClientPort}`,
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.riotClientAuthToken}`).toString('base64')}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
        maxCachedSessions: 2048,
        maxFreeSockets: 1024
      }),
      httpAgent: new http.Agent({
        keepAlive: true,
        maxFreeSockets: 1024
      }),
      timeout: LcuConnectionModule.REQUEST_TIMEOUT_MS,
      proxy: false
    })
  }

  private async _connectToLcu(auth: UxCommandLine) {
    try {
      if (this.state.state === 'connecting' || this.state.state === 'connected') {
        return
      }

      const { certificate, ...rest } = auth
      this._logger.info(`尝试连接，${JSON.stringify(rest)}`)
      this.state.setConnecting()

      await this._initWebSocket(auth)

      let timeoutTimer: NodeJS.Timeout
      await new Promise<void>((resolve, reject) => {
        timeoutTimer = setTimeout(() => {
          this._lcuWs!.close()
          const error = new Error(
            `timeout trying to connect to LCU Websocket: ${LcuConnectionModule.INTERVAL_TIMEOUT}ms`
          )
          error.name = 'LCU:TIMEOUT'
          reject(error)
        }, LcuConnectionModule.INTERVAL_TIMEOUT)

        this._lcuWs!.on('open', async () => {
          try {
            await this._initLcuHttpInstance(auth)
            this._initRcHttpInstance(auth)
            clearTimeout(timeoutTimer)
          } catch (error) {
            this._lcuWs?.close()
            reject(error)
          }

          const _sendTask = (code: number, eventName: string) =>
            new Promise<void>((resolve, reject) => {
              this._lcuWs!.send(JSON.stringify([code, eventName]), (error) => {
                if (error instanceof Error) {
                  reject(error)
                } else {
                  resolve()
                }
              })
            })

          const subTasks = SUBSCRIBED_LCU_ENDPOINTS.map((eventName) => _sendTask(5, eventName))

          Promise.all(subTasks)
            .then(() => {
              this.state.setConnected(auth)
              resolve()
            })
            .catch((error) => {
              this.state.setDisconnected()
              this._lcuWs!.close()
              reject(error)
            })
        })

        this._lcuWs!.on('error', (error) => {
          this.state.setDisconnected()
          clearTimeout(timeoutTimer)
          reject(error)
        })
      })

      this._lcuWs!.on('close', () => {
        this.state.setDisconnected()
        clearTimeout(timeoutTimer)
      })

      this._lcuWs!.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString())
          this._lcuEventBus.emit(data[2].uri, data[2])
        } catch {
          /* TODO NOTHING */
        }
      })
    } catch (error) {
      this.state.setDisconnected()
      throw error
    }
  }

  private async _doConnectingLoop() {
    while (true) {
      // 连接途中，目标丢失，停止连接
      if (!this.state.connectingClient) {
        break
      }

      // 目标连接对象已不在当前启动列表中，停止连接
      if (!this.state.launchedClients.find((c) => c.pid === this.state.connectingClient?.pid)) {
        this.state.setConnectingClient(null)
        break
      }

      try {
        await this._connectToLcu(this.state.connectingClient)
        this.state.setConnectingClient(null) // finished connecting!
        break
      } catch (error) {
        if ((error as any).code !== 'ECONNREFUSED') {
          this._mwm.notify.error(
            'lcu-connection',
            '连接错误',
            `尝试连接到 LCU 时发生错误：${(error as any)?.message}`
          )
          this._logger.error(`尝试连接到 LCU 客户端时发生错误 ${formatError(error)}`)
          break
        }
      }

      await sleep(LcuConnectionModule.CONNECT_TO_LCU_RETRY_INTERVAL)
    }
  }

  async lcuRequest<T = any, D = any>(config: AxiosRequestConfig<D>, maxRetries = 3) {
    if (!this._lcuHttp) {
      throw new Error('LCU disconnected')
    }

    if (config.url && config.url.startsWith('lol-game-data/assets')) {
      return this._lcuRequestWithLimiter<T, D>(config, this._assetLimiter, maxRetries)
    } else {
      return this._lcuRequestWithRetries<T, D>(config, maxRetries)
    }
  }

  async rcRequest<T = any, D = any>(config: AxiosRequestConfig<D>) {
    if (!this._rcHttp) {
      throw new Error('Riot Client unavailable')
    }

    return this._rcHttp.request<T>(config)
  }

  /**
   * 有并发限制的请求，适合请求资源
   */
  private async _lcuRequestWithLimiter<T = any, D = any>(
    config: AxiosRequestConfig<D>,
    limiter: PQueue,
    maxRetries = 3
  ) {
    const res = await limiter.add(() => this._lcuRequestWithRetries<T>(config, maxRetries))

    if (!res) {
      throw new Error('asset request failed')
    }

    return res
  }

  async _lcuRequestWithRetries<T = any, D = any>(config: AxiosRequestConfig<D>, maxRetries = 3) {
    if (!this._lcuHttp) {
      throw new Error('LCU disconnected')
    }

    let retries = 0
    let lastError: any = null

    while (true) {
      try {
        const res = await this._lcuHttp.request<T>(config)
        return res
      } catch (error) {
        lastError = error

        if (isAxiosError(error)) {
          if (
            error.code === 'ECONNABORTED' ||
            (error.response?.status && error.response.status >= 500)
          ) {
            retries++
          } else {
            throw error
          }
        } else {
          throw error
        }
      }

      if (retries >= maxRetries) {
        throw lastError || new Error('max retries exceeded')
      }
    }
  }

  private _setupMethodCall() {
    this.onCall('game-client-http-request', async (config) => {
      try {
        const { config: c, request, ...rest } = await this._gcHttp.request(config)

        return {
          ...rest,
          config: { data: c.data, url: c.url }
        }
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          const { config: c, request, ...rest } = error.response
          return {
            ...rest,
            config: { data: c.data, url: c.url }
          }
        }

        this._logger.warn(`游戏客户端错误 Game Client: ${formatError(error)}`)

        throw error
      }
    })

    this.onCall('lcu-http-request', async (config) => {
      if (this.state.state !== 'connected') {
        throw new Error('LCU uninitialized')
      }

      // 通过 IPC 调用的网络请求，则是不完整的可序列化信息
      try {
        const { config: c, request, ...rest } = await this._lcuHttp!.request(config)

        return {
          ...rest,
          config: { data: c.data, url: c.url }
        }
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          const { config: c, request, ...rest } = error.response
          return {
            ...rest,
            config: { data: c.data, url: c.url }
          }
        }

        this._logger.warn(`LCU HTTP 客户端错误: ${formatError(error)}`)

        throw error
      }
    })

    this.onCall('lcu-connect', async (auth: UxCommandLine) => {
      if (this.state.state === 'connected') {
        this._disconnect()
      }

      this.state.setLaunchedClients(await this._lcm.getLaunchedClients())
      this.state.setConnectingClient(auth)
    })

    this.onCall('lcu-disconnect', async () => {
      this._disconnect()
    })
  }

  private _disconnect() {
    if (this._lcuWs) {
      this._lcuWs.close()
      this._lcuWs = null
    }

    if (this._lcuHttp) {
      this._lcuHttp = null
    }

    this.state.setDisconnected()
  }

  private _setupStateSync() {
    this.propSync('state', this.state, [
      'state',
      'auth',
      'launchedClients',
      'connectingClient',
      'settings.autoConnect'
    ])
  }
}

export const lcuConnectionModule = new LcuConnectionModule()
