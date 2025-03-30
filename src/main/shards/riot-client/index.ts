import { UxCommandLine } from '@main/utils/ux-cmd'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import https from 'https'

import { AkariProtocolMain } from '../akari-protocol'
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
@Shard(RiotClientMain.id)
export class RiotClientMain implements IAkariShardInitDispose {
  static id = 'riot-client-main'

  static REQUEST_TIMEOUT_MS = 12500

  private readonly _log: AkariLogger

  private _api: RiotClientHttpApiAxiosHelper | null = null

  private _http: AxiosInstance | null = null

  // Riot Client 的事件推送格式和 League Client 完全相同, 但由于当前应用暂未使用, 所以不实现
  // private _ws: WebSocket | null = null
  // private _eventBus = new RadixEventEmitter()

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _lc: LeagueClientMain,
    private readonly _protocol: AkariProtocolMain
  ) {
    this._log = _loggerFactory.create(RiotClientMain.id)

    this._handleProtocol()
  }

  get api() {
    if (!this._api) {
      throw new RiotClientRcuUninitializedError()
    }

    return this._api
  }

  private _handleProtocol() {
    this._protocol.registerDomain('riot-client', async (uri, req) => {
      const reqHeaders: Record<string, string> = {}
      req.headers.forEach((value, key) => {
        reqHeaders[key] = value
      })

      try {
        const config: AxiosRequestConfig = {
          method: req.method,
          url: uri,
          data: req.body ? AkariProtocolMain.convertWebStreamToNodeStream(req.body) : undefined,
          validateStatus: () => true,
          responseType: 'stream',
          headers: reqHeaders
        }

        const res = await this.request(config)

        const resHeaders = Object.fromEntries(
          Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(res.status === 204 || res.status === 304 ? null : res.data, {
          statusText: res.statusText,
          headers: resHeaders,
          status: res.status
        })
      } catch (error) {
        this._log.warn(`Failed to RiotClient request`, error)

        if (error instanceof RiotClientRcuUninitializedError) {
          return new Response(JSON.stringify({ error: error.name }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          })
        }

        return new Response((error as Error).message, {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    })
  }

  private _handleCall() {
    this._ipc.onCall(RiotClientMain.id, 'http-request', async (_, config) => {
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
        keepAlive: true
      }),
      httpAgent: new https.Agent({
        keepAlive: true
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
      },
      { fireImmediately: true }
    )
  }

  async onDispose() {
    this._http = null
    this._api = null
    this._protocol.unregisterDomain('riot-client')
  }
}
