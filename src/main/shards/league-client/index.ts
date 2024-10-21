import { UxCommandLine } from '@main/utils/ux-cmd'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { SUBSCRIBED_LCU_ENDPOINTS } from '@shared/constants/subscribed-lcu-endpoints'
import { RadixEventEmitter } from '@shared/event-emitter'
import { LeagueClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/league-client'
import { sleep } from '@shared/utils/sleep'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import { AxiosRetry } from 'axios-retry'
import { comparer } from 'mobx'
import https from 'node:https'
import PQueue from 'p-queue'
import WebSocket from 'ws'

import { AkariIpcMain } from '../ipc'
import { LeagueClientUxMain } from '../league-client-ux'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { LeagueClientSyncedData } from './data'
import { LeagueClientSettings, LeagueClientState } from './state'

const axiosRetry = require('axios-retry').default as AxiosRetry

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
    'app-common-main',
    'logger-factory-main',
    'mobx-utils-main',
    'league-client-ux-main'
  ]

  static INTERNAL_TIMEOUT = 12500
  static CONNECT_TO_LC_RETRY_INTERVAL = 750
  static HTTP_PING_URL = '/riotclient/auth-token'
  static REQUEST_TIMEOUT_MS = 12500

  public readonly settings = new LeagueClientSettings()
  public readonly state = new LeagueClientState()

  private readonly _ipc: AkariIpcMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger
  private readonly _mobx: MobxUtilsMain
  private readonly _ux: LeagueClientUxMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _setting: MobxSettingService

  private _http: AxiosInstance | null = null
  private _ws: WebSocket | null = null

  private _api: LeagueClientHttpApiAxiosHelper | null = null
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

  get events() {
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
    this._settingFactory = deps['setting-factory-main']
    this._setting = this._settingFactory.create(
      LeagueClientMain.id,
      {
        autoConnect: { default: this.settings.autoConnect }
      },
      this.settings
    )
  }

  async onInit() {
    this._handleState()
    this._handleCall()
    this._handleConnect()
    this._data.init()
  }

  async onDispose() {
    this._disconnect()
    this.events.clear()
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(LeagueClientMain.id, 'state', this.state, [
      'connectionState',
      'auth',
      'connectingClient'
    ])
    this._mobx.propSync(LeagueClientMain.id, 'settings', this.settings, ['autoConnect'])
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

        this._log.warn('LeagueClient HTTP 客户端错误', error)

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
          this.settings.autoConnect,
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
          this._log.info(`LCU 状态发生变化: ${s}`, rest)
        } else {
          this._log.info(`LCU 状态发生变化: ${s}`, a)
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
          this._log.error(`尝试连接到 LC 时发生错误`, error)
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
      this._log.info(`尝试连接`, rest)
      this.state.setConnecting()

      await this._initWebSocket(auth)

      let timeoutTimer: NodeJS.Timeout | null
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
            clearTimeout(timeoutTimer!)
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
          clearTimeout(timeoutTimer!)
          reject(error)
        })
      })

      this._ws!.on('close', () => {
        this.state.setDisconnected()
        clearTimeout(timeoutTimer!)
        timeoutTimer = null
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

    axiosRetry(this._http, {
      retries: 2,
      retryCondition: (error) => {
        if (error.response === undefined) {
          return true
        }

        if (error.response.status >= 400 && error.response.status < 500) {
          return false
        }

        return true
      }
    })

    try {
      await this._http.get(LeagueClientMain.HTTP_PING_URL)
      this._api = new LeagueClientHttpApiAxiosHelper(this._http)
    } catch (error) {
      if (isAxiosError(error) && (!error.response || (error.status && error.status >= 500))) {
        this._log.warn(`无法执行 PING 操作`, error)
        throw new Error('http initialization PING failed')
      }
    }
  }

  async request<T = any, D = any>(config: AxiosRequestConfig<D>) {
    if (!this._http) {
      throw new Error('LC disconnected')
    }

    if (config.url && config.url.startsWith('lol-game-data/assets')) {
      return this._limitedRequest(config, this._assetLimiter)
    } else {
      return this.http.request<T>(config)
    }
  }

  private async _limitedRequest<T = any, D = any>(config: AxiosRequestConfig<D>, limiter: PQueue) {
    const res = await limiter.add(() => this.http.request<T>(config))

    if (!res) {
      throw new Error('asset request failed')
    }

    return res
  }
}
