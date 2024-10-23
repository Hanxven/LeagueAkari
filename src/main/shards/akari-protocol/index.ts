import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AxiosRequestConfig } from 'axios'
import { session } from 'electron'
import { Readable } from 'node:stream'

import { LeagueClientHttpUninitializedError, LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { RiotClientHttpUninitializedError, RiotClientMain } from '../riot-client'
import { WindowManagerMain } from '../window-manager'

/**
 * 实现 `akari://` 协议, 用于渲染进程 HTTP 请求的代理
 * 代理 league-client 和 riot-client 的请求
 */
export class AkariProtocolMain implements IAkariShardInitDispose {
  static id = 'akari-protocol-main'
  static dependencies = ['league-client-main', 'riot-client-main', 'logger-factory-main']

  static AKARI_PROTOCOL = 'akari'

  private readonly _leagueClient: LeagueClientMain
  private readonly _riotClient: RiotClientMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger

  constructor(deps: any) {
    this._leagueClient = deps['league-client-main']
    this._riotClient = deps['riot-client-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(AkariProtocolMain.id)
  }

  async onInit() {
    this._handlePartitionAkariProtocol(WindowManagerMain.MAIN_WINDOW_PARTITION)
    this._handlePartitionAkariProtocol(WindowManagerMain.AUX_WINDOW_PARTITION)
  }

  async onDispose() {
    this._unhandlePartitionAkariProtocol(WindowManagerMain.MAIN_WINDOW_PARTITION)
    this._unhandlePartitionAkariProtocol(WindowManagerMain.AUX_WINDOW_PARTITION)
  }

  private _unhandlePartitionAkariProtocol(partition: string) {
    session.fromPartition(partition).protocol.unhandle(AkariProtocolMain.AKARI_PROTOCOL)
  }

  private _handlePartitionAkariProtocol(partition: string) {
    session
      .fromPartition(partition)
      .protocol.handle(AkariProtocolMain.AKARI_PROTOCOL, async (req) => {
        const path = req.url.slice(`${AkariProtocolMain.AKARI_PROTOCOL}://`.length)
        const index = path.indexOf('/')
        const domain = path.slice(0, index).trim()
        const uri = path.slice(index + 1).trim()

        const reqHeaders: Record<string, string> = {}
        req.headers.forEach((value, key) => {
          reqHeaders[key] = value
        })

        switch (domain) {
          case 'league-client':
          case 'riot-client':
            try {
              const config: AxiosRequestConfig = {
                method: req.method,
                url: uri,
                data: req.body ? this._convertWebStreamToNodeStream(req.body) : undefined,
                validateStatus: () => true,
                responseType: 'stream',
                headers: reqHeaders
              }

              const res =
                domain === 'league-client'
                  ? await this._leagueClient.request(config)
                  : await this._riotClient.request(config)

              const resHeaders = Object.fromEntries(
                Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
              )

              return new Response(res.status === 204 || res.status === 304 ? null : res.data, {
                statusText: res.statusText,
                headers: resHeaders,
                status: res.status
              })
            } catch (error) {
              this._log.warn(`Failed to proxy request`, error)

              if (
                error instanceof LeagueClientHttpUninitializedError ||
                error instanceof RiotClientHttpUninitializedError
              ) {
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
          default:
            return new Response(`Unknown akari zone: ${domain}`, {
              statusText: 'Not Found',
              headers: {
                'Content-Type': 'text/plain'
              },
              status: 404
            })
        }
      })
  }

  private _convertWebStreamToNodeStream(readableStream: ReadableStream) {
    const reader = readableStream.getReader()

    const nodeStream = Readable.from({
      async *[Symbol.asyncIterator]() {
        while (true) {
          try {
            const { done, value } = await reader.read()
            if (done) break
            yield value
          } catch {
            break
          }
        }
      }
    })

    return nodeStream
  }
}
