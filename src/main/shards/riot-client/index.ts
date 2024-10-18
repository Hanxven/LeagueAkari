import { UxCommandLine } from '@main/utils/ux-cmd'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import https from 'https'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'

export class RiotClientRcuUninitializedError extends Error {
  name = 'RiotClientRcuUninitializedError'
}

/**
 * Riot Client 相关封装
 */
export class RiotClientMain implements IAkariShardInitDispose {
  static id = 'riot-client-main'
  static dependencies = [
    'akari-ipc-main',
    'logger-factory-main',
    'mobx-utils-main',
    'league-client-main' // 引入此依赖的原因是, 需要获取其使用的是哪个客户端 (考虑到客户端多开的情况)
  ]

  static REQUEST_TIMEOUT_MS = 12500

  private readonly _ipc: AkariIpcMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger
  private readonly _mobx: MobxUtilsMain
  private readonly _lc: LeagueClientMain

  private _api: RiotClientHttpApiAxiosHelper | null = null

  private _http: AxiosInstance | null = null

  // Riot Client 的事件推送格式和 League Client 完全相同, 但由于当前应用暂未使用, 所以不实现
  // private _ws: WebSocket | null = null
  // private _eventBus = new RadixEventEmitter()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._lc = deps['league-client-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(RiotClientMain.id)
  }

  get api() {
    if (!this._api) {
      throw new RiotClientRcuUninitializedError()
    }

    return this._api
  }

  private _handleCall() {
    this._ipc.onCall(RiotClientMain.id, 'http-request', async (config) => {
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

        this._log.warn(`RiotClient HTTP 客户端错误`, error)

        throw error
      }
    })
  }

  private _initHttpInstance(auth: UxCommandLine) {
    this._http = axios.create({
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
      httpAgent: new https.Agent({
        keepAlive: true,
        maxFreeSockets: 1024
      }),
      timeout: RiotClientMain.REQUEST_TIMEOUT_MS,
      proxy: false
    })

    this._api = new RiotClientHttpApiAxiosHelper(this._http)
  }

  /**
   * RC 的请求, 🐰
   */
  async request<T = any, D = any>(config: AxiosRequestConfig<D>) {
    if (!this._http) {
      throw new Error('RC Uninitialized')
    }

    return this._http.request<T>(config)
  }

  async onInit() {
    this._handleCall()

    this._mobx.reaction(
      () => this._lc.state.auth,
      async (auth) => {
        if (auth) {
          this._initHttpInstance(auth)
        } else {
          this._http = null
          this._api = null
        }
      }
    )
  }

  async onDispose() {
    this._http = null
    this._api = null
  }
}
