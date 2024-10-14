import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AxiosRequestConfig } from 'axios'
import { protocol, session } from 'electron'
import { Readable } from 'node:stream'

import { LeagueClientMain } from '../league-client'
import { RiotClientMain } from '../riot-client'
import { WindowManagerMain } from '../window-manager'

/**
 * 实现 `akari://` 协议, 用于渲染进程 HTTP 请求的代理
 */
export class AkariProtocolMain implements IAkariShardInitDispose {
  static id = 'akari-protocol-main'
  static dependencies = ['league-client-main', 'riot-client-main']

  static AKARI_PROTOCOL = 'akari'

  private readonly _leagueClient: LeagueClientMain
  private readonly _riotClient: RiotClientMain

  constructor(deps: any) {
    this._leagueClient = deps['league-client-main']
    this._riotClient = deps['riot-client-main']
  }

  /**
   * 需要在 `app.whenReady` 之前调用这个方法
   */
  static registerAkariProtocolAsPrivileged() {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: AkariProtocolMain.AKARI_PROTOCOL,
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
          corsEnabled: true,
          stream: true,
          bypassCSP: true
        }
      }
    ])
  }

  async onInit() {
    this._handlePartitionAkariProtocol(WindowManagerMain.MW_PARTITION)
    this._handlePartitionAkariProtocol(WindowManagerMain.AW_PARTITION)
  }

  async onDispose() {
    this._unhandlePartitionAkariProtocol(WindowManagerMain.MW_PARTITION)
    this._unhandlePartitionAkariProtocol(WindowManagerMain.AW_PARTITION)
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
        const domain = path.slice(0, index)
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
              console.error(error)
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
