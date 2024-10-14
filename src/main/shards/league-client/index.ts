import { UxCommandLine } from '@main/utils/ux-cmd'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { SUBSCRIBED_LCU_ENDPOINTS } from '@shared/constants/subscribed-lcu-endpoints'
import { RadixEventEmitter } from '@shared/event-emitter'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import { comparer } from 'mobx'
import https from 'node:https'
import PQueue from 'p-queue'
import WebSocket from 'ws'

import { AkariIpcMain } from '../ipc'
import { LeagueClientUxMain } from '../league-client-ux'
import { AkariLoggerInstance, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { LeagueClientSyncedData } from './data'
import { LeagueClientHttpApi } from './http-api'
import { LeagueClientState } from './state'

export interface LaunchSpectatorConfig {
  locale?: string
  region: string
  puuid: string
}

/**
 * League Client 相关功能, 包括与 LeagueClient.exe 的连接, 封装的 HTTP 请求, 以及 WebSocket 通信
 */
export class LeagueClientMain implements IAkariShardInitDispose {
  static id = 'league-client-main'
  static dependencies = [
    'akari-ipc-main',
    'common-main',
    'logger-factory-main',
    'mobx-utils-main',
    'league-client-ux-main'
  ]

  static INTERNAL_TIMEOUT = 12500
  static CONNECT_TO_LC_RETRY_INTERVAL = 750
  static HTTP_PING_URL = '/riotclient/auth-token'
  static REQUEST_TIMEOUT_MS = 12500

  public readonly state = new LeagueClientState()

  private readonly _ipc: AkariIpcMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLoggerInstance
  private readonly _mobx: MobxUtilsMain
  private readonly _ux: LeagueClientUxMain

  private _http: AxiosInstance | null = null
  private _ws: WebSocket | null = null

  private _api: LeagueClientHttpApi | null = null
  private _data: LeagueClientSyncedData

  private _eventBus = new RadixEventEmitter()

  private _assetLimiter = new PQueue({ concurrency: 8 })

  private _manuallyDisconnected = false

  get http() {
    if (!this._http) {
      throw new Error('LC HTTP uninitialized')
    }

    return this._http
  }

  get api() {
    if (!this._api) {
      throw new Error('LC HTTP uninitialized')
    }

    return this._api
  }

  get data() {
    return this._data
  }

  get eventBus() {
    return this._eventBus
  }

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._ux = deps['league-client-ux-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(LeagueClientMain.id)

    this._data = new LeagueClientSyncedData(this, LeagueClientMain, {
      log: this._log,
      ipc: this._ipc,
      mobx: this._mobx
    })
  }

  async onInit() {
    this._handleState()
    this._handleCall()
    this._handleConnect()
    this._data.init()
  }

  async onDispose() {
    this._disconnect()
    this.eventBus.clear()
  }

  private _handleState() {
    this._mobx.propSync(LeagueClientMain.id, 'state', this.state, [
      'connectionState',
      'auth',
      'connectingClient',
      'settings.autoConnect'
    ])
  }

  private _handleCall() {
    this._ipc.onCall(LeagueClientMain.id, 'http-request', async (config) => {
      if (this.state.connectionState !== 'connected') {
        throw new Error('LCU uninitialized')
      }

      // 通过 IPC 调用的网络请求，则是不完整的可序列化信息
      try {
        const { config: c, request, ...rest } = await this._http!.request(config)

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

        this._log.warn(`LeagueClient HTTP 客户端错误: ${formatError(error)}`)

        throw error
      }
    })

    this._ipc.onCall(LeagueClientMain.id, 'connect', async (auth: UxCommandLine) => {
      if (this.state.connectionState === 'connected') {
        this._disconnect()
      }

      await this._ux.update()
      this.state.setConnectingClient(auth)
    })

    this._ipc.onCall(LeagueClientMain.id, 'disconnect', async () => {
      this._disconnect()
      this._manuallyDisconnected = true
    })
  }

  /**
   * 断开与 LeagueClient 的连接, 主要是 WebSocket
   */
  private _disconnect() {
    if (this._ws) {
      this._ws.close()
    }

    this._ws = null
    this._http = null
    this._api = null

    this.state.setDisconnected()
  }

  private async _handleConnect() {
    this._mobx.reaction(
      () => this.state.connectingClient,
      (auth) => {
        if (!auth) {
          return
        }

        this._doConnectingLoop()
      }
    )

    // 当客户端唯一时，自动连接到该 LeagueClient
    this._mobx.reaction(
      () =>
        [
          this.state.settings.autoConnect,
          this._ux.state.launchedClients,
          this.state.connectionState
        ] as const,
      async ([s, c, conn], [ps, _, __]) => {
        if (conn === 'connected') {
          return
        }

        // 抖动一下可以清除该状态
        if (ps === false && s === true) {
          this._manuallyDisconnected = false
        }

        if (s) {
          if (c.length === 1) {
            if (!this._manuallyDisconnected) {
              this.state.setConnectingClient(c[0])
            }
          } else {
            this.state.setConnectingClient(null)
          }
        }
      }
    )

    // 仅作为日志记录
    this._mobx.reaction(
      () => [this.state.auth, this.state.connectionState] as const,
      ([a, s]) => {
        if (a) {
          const { certificate, ...rest } = a
          this._log.info(`LCU 状态发生变化: ${s} ${JSON.stringify(rest)}`)
        } else {
          this._log.info(`LCU 状态发生变化: ${s} ${JSON.stringify(a)}`)
        }
      },
      { equals: comparer.shallow }
    )
  }

  private async _doConnectingLoop() {
    while (true) {
      // 连接途中，目标丢失，停止连接
      if (!this.state.connectingClient) {
        break
      }

      // 目标连接对象已不在当前启动列表中，停止连接
      if (!this._ux.state.launchedClients.find((c) => c.pid === this.state.connectingClient?.pid)) {
        this.state.setConnectingClient(null)
        break
      }

      try {
        await this._connectToLcu(this.state.connectingClient)
        this.state.setConnectingClient(null) // finished connecting!
        break
      } catch (error) {
        if ((error as any).code !== 'ECONNREFUSED') {
          this._ipc.sendEvent(LeagueClientMain.id, 'error-connecting', (error as any)?.message)
          this._log.error(`尝试连接到 LC 时发生错误 ${formatError(error)}`)
          break
        }
      }

      await sleep(LeagueClientMain.CONNECT_TO_LC_RETRY_INTERVAL)
    }
  }

  private async _connectToLcu(auth: UxCommandLine) {
    try {
      if (
        this.state.connectionState === 'connecting' ||
        this.state.connectionState === 'connected'
      ) {
        return
      }

      const { certificate, ...rest } = auth
      this._log.info(`尝试连接，${JSON.stringify(rest)}`)
      this.state.setConnecting()

      await this._initWebSocket(auth)

      let timeoutTimer: NodeJS.Timeout
      await new Promise<void>((resolve, reject) => {
        timeoutTimer = setTimeout(() => {
          this._ws!.close()
          const error = new Error(
            `timeout trying to connect to LC Websocket: ${LeagueClientMain.INTERNAL_TIMEOUT}ms`
          )
          error.name = 'LC:TIMEOUT'
          reject(error)
        }, LeagueClientMain.INTERNAL_TIMEOUT)

        this._ws!.on('open', async () => {
          try {
            await this._initHttpInstance(auth)
            clearTimeout(timeoutTimer)
          } catch (error) {
            this._ws?.close()
            reject(error)
          }

          const _sendTask = (code: number, eventName: string) =>
            new Promise<void>((resolve, reject) => {
              this._ws!.send(JSON.stringify([code, eventName]), (error) => {
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
              this._ws!.close()
              reject(error)
            })
        })

        this._ws!.on('error', (error) => {
          this.state.setDisconnected()
          clearTimeout(timeoutTimer)
          reject(error)
        })
      })

      this._ws!.on('close', () => {
        this.state.setDisconnected()
        clearTimeout(timeoutTimer)
      })

      this._ws!.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString())
          this._eventBus.emit(data[2].uri, data[2])
        } catch {
          /* TODO NOTHING */
        }
      })
    } catch (error) {
      this._ws = null
      this._http = null
      this._api = null
      this.state.setDisconnected()
      throw error
    }
  }

  private async _initWebSocket(auth: UxCommandLine) {
    this._ws = new WebSocket(`wss://riot:${auth.authToken}@127.0.0.1:${auth.port}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.authToken}`).toString('base64')}`
      },
      protocol: 'wamp',
      rejectUnauthorized: false
    })
  }

  private async _initHttpInstance(auth: UxCommandLine) {
    this._http = axios.create({
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
      httpAgent: new https.Agent({
        keepAlive: true,
        maxFreeSockets: 1024
      }),
      timeout: LeagueClientMain.REQUEST_TIMEOUT_MS,
      proxy: false
    })

    try {
      await this._http.get(LeagueClientMain.HTTP_PING_URL)
      this._api = new LeagueClientHttpApi(this._http)
    } catch (error) {
      if (isAxiosError(error) && (!error.response || (error.status && error.status >= 500))) {
        this._log.warn(`无法执行 PING 操作: ${formatError(error)}`)

        throw new Error('http initialization PING failed')
      }
    }
  }

  async request<T = any, D = any>(config: AxiosRequestConfig<D>, maxRetries = 3) {
    if (!this._http) {
      throw new Error('LC disconnected')
    }

    if (config.url && config.url.startsWith('lol-game-data/assets')) {
      return this._limitedRequest<T, D>(config, this._assetLimiter, maxRetries)
    } else {
      return this._retryRequest<T, D>(config, maxRetries)
    }
  }

  private async _limitedRequest<T = any, D = any>(
    config: AxiosRequestConfig<D>,
    limiter: PQueue,
    maxRetries = 3
  ) {
    const res = await limiter.add(() => this._retryRequest<T>(config, maxRetries))

    if (!res) {
      throw new Error('asset request failed')
    }

    return res
  }

  private async _retryRequest<T = any, D = any>(config: AxiosRequestConfig<D>, maxRetries = 3) {
    if (!this._http) {
      throw new Error('LC disconnected')
    }

    let retries = 0
    let lastError: any = null

    while (true) {
      try {
        const res = await this._http.request<T>(config)
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

  // private async _launchSpectator(config: LaunchSpectatorConfig) {
  //   const {
  //     game: { gameMode },
  //     playerCredentials: { observerServerIp, observerServerPort, observerEncryptionKey, gameId }
  //   } = await this._eds.sgp.getSpectatorGameflow(config.puuid, config.region)

  //   if (!this._lcm.lcuHttp) {
  //     throw new Error('LCU not connected')
  //   }

  //   const { data: installDir } = await this._lcm.lcuHttp.request<{
  //     gameExecutablePath: string
  //     gameInstallRoot: string
  //   }>({
  //     url: '/lol-patch/v1/products/league_of_legends/install-location',
  //     method: 'GET'
  //   })

  //   const cmds = [
  //     `spectator ${observerServerIp}:${observerServerPort} ${observerEncryptionKey} ${gameId} ${config.region}`,
  //     `-GameBaseDir=${installDir.gameInstallRoot}`,
  //     `-Locale=${config.locale || 'zh-CN'}`
  //   ]

  //   if (gameMode === 'TFT') {
  //     cmds.push('-Product=TFT')
  //   }

  //   // 调起进程但不与其关联
  //   const p = spawn(installDir.gameExecutablePath, cmds, {
  //     cwd: installDir.gameInstallRoot,
  //     detached: true
  //   })

  //   p.unref()
  // }
}
