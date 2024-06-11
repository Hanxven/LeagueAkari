import { LcuAuth } from '@main/utils/lcu-auth'
import { LeagueAkariModuleManager } from '@shared/akari/main-module-manager'
import { MobxBasedModule } from '@shared/akari/mobx-based-module'
import { SUBSCRIBED_LCU_ENDPOINTS } from '@shared/constants/subscribed-lcu-endpoints'
import { RadixEventEmitter } from '@shared/event-emitter'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import axios, { AxiosInstance, isAxiosError } from 'axios'
import https from 'https'
import { comparer, computed, makeAutoObservable, observable } from 'mobx'
import { WebSocket } from 'ws'

import { appState } from './app'
import { AppLogger, AppModule } from './app-new'
import { getLaunchedClients } from './lcu-client'
import { mwNotification } from './main-window'

export type LcuConnectionStateType = 'connecting' | 'connected' | 'disconnected'

class LcuConnectionState {
  state: LcuConnectionStateType = 'disconnected'

  auth: LcuAuth | null = null

  launchedClients: LcuAuth[] = []

  connectingClient: LcuAuth | null = null

  constructor() {
    makeAutoObservable(this, {
      auth: observable.ref,
      launchedClients: observable.struct,
      connectingClient: observable.struct
    })
  }

  setConnected(auth: LcuAuth) {
    this.state = 'connected'
    this.auth = auth
  }

  setConnecting() {
    this.state = 'connecting'
    this.auth = null
  }

  setDisconnected() {
    this.state = 'disconnected'
    this.auth = null
  }

  setLaunchedClients(c: LcuAuth[]) {
    this.launchedClients = c
  }

  setConnectingClient(c: LcuAuth | null) {
    this.connectingClient = c
  }
}

export class LcuConnectionModule extends MobxBasedModule {
  public state = new LcuConnectionState()

  private _logger!: AppLogger
  private _appModule!: AppModule

  static GAME_CLIENT_BASE_URL = 'https://127.0.0.1:2999'
  static INTERVAL_TIMEOUT = 12500
  static CLIENT_CMD_POLL_INTERVAL = 2000
  static CONNECT_TO_LCU_RETRY_INTERVAL = 750
  static PING_URL = '/riotclient/auth-token'
  static REQUEST_TIMEOUT_MS = 12500

  private _gcHttp = axios.create({
    baseURL: LcuConnectionModule.GAME_CLIENT_BASE_URL,
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
  })

  private _clientPollTimerId: NodeJS.Timeout

  private _lcuHttp: AxiosInstance | null = null
  private _lcuWs: WebSocket | null = null

  private _lcuEventBus = new RadixEventEmitter()

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
    super('lcu-connection', ['app'])
  }

  override async onRegister(manager: LeagueAkariModuleManager) {
    await super.onRegister(manager)

    const appModule = manager.getModule<AppModule>('app')!
    this._appModule = appModule
    this._logger = appModule.createLogger('lcu-connection')

    this._setupStateSync()
    this._setupMethodCall()
    this._handleAutoConnect()

    this._logger.info('初始化完成')
  }

  private async _handleAutoConnect() {
    const pollTiming = computed(() => {
      if (this.state.state === 'connected') {
        return 'stop-it!'
      }

      if (!this._appModule.state.isAdministrator && this._appModule.state.settings.useWmic) {
        return 'stop-it!'
      }

      return 'do-polling！'
    })

    this.autoDisposeReaction(
      () => pollTiming.get(),
      (state) => {
        if (state === 'stop-it!') {
          this.state.setLaunchedClients([])
          clearInterval(this._clientPollTimerId)
          return
        }

        const _pollFn = async () => {
          try {
            this.state.setLaunchedClients(await getLaunchedClients())
          } catch (error) {
            mwNotification.error('lcu-connection', '进程轮询', '在获取客户端进程信息时发生错误')
            this._logger.error(`获取客户端信息时失败 ${formatError(error)}`)
          }
        }

        _pollFn()
        this._clientPollTimerId = setInterval(_pollFn, LcuConnectionModule.CLIENT_CMD_POLL_INTERVAL)
      },
      { fireImmediately: true }
    )

    this.autoDisposeReaction(
      () => this.state.connectingClient,
      (auth) => {
        if (!auth) {
          return
        }

        this._doConnectingLoop()
      }
    )

    // 自动连接 - 当客户端唯一时，自动连接到 LCU 客户端
    this.autoDisposeReaction(
      () => [appState.settings.autoConnect, this.state.launchedClients] as const,
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

    this.autoDisposeReaction(
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

  private async _initWebSocket(auth: LcuAuth) {
    this._lcuWs = new WebSocket(`wss://riot:${auth.password}@127.0.0.1:${auth.port}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.password}`).toString('base64')}`
      },
      protocol: 'wamp',
      rejectUnauthorized: false
    })
  }

  private async _initHttpInstance(auth: LcuAuth) {
    this._lcuHttp = axios.create({
      baseURL: `https://127.0.0.1:${auth.port}`,
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.password}`).toString('base64')}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
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

  private async _connectToLcu(auth: LcuAuth) {
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
            await this._initHttpInstance(auth)
            clearTimeout(timeoutTimer)
          } catch (error) {
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
          mwNotification.error(
            'lcu-connection',
            '连接错误',
            `尝试连接到 LCU 时发生错误：${(error as any)?.message}`
          )
          this._logger.error(`尝试连接到 LCU 客户端时发生错误 ${formatError(error)}`)
        }
      }

      await sleep(LcuConnectionModule.CONNECT_TO_LCU_RETRY_INTERVAL)
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

    this.onCall('lcu-connect', async (auth: LcuAuth) => {
      this.state.setConnectingClient(auth)
    })

    this.onCall('lcu-disconnect', async () => {
      if (this._lcuWs) {
        this._lcuWs.close()
        this._lcuWs = null
      }

      if (this._lcuHttp) {
        this._lcuHttp = null
      }

      this.state.setDisconnected()
    })
  }

  private _setupStateSync() {
    this.simpleSync('state', () => this.state.state)
    this.simpleSync('auth', () => this.state.auth)
    this.simpleSync('launched-clients', () => this.state.launchedClients)
    this.simpleSync('connecting-client', () => this.state.connectingClient)
  }
}
