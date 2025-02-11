import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { protocol, session } from 'electron'
import { Readable } from 'node:stream'

import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { WindowManagerMain } from '../window-manager'
import { AkariAuxWindow } from '../window-manager/aux-window/window'
import { AkariMainWindow } from '../window-manager/main-window/window'
import { AkariOpggWindow } from '../window-manager/opgg-window/window'

/**
 * 实现 `akari://` 协议, 用户特殊资源的代理
 * akari://league-client/* 代理到 LeagueClient 的 HTTP 服务
 * akari://riot-client/* 代理到 RiotClient 的 HTTP 服务
 */
export class AkariProtocolMain implements IAkariShardInitDispose {
  static id = 'akari-protocol-main'

  static AKARI_PROXY_PROTOCOL = 'akari'

  private readonly _domainRegistry = new Map<
    string,
    (uri: string, req: Request) => Promise<Response> | Response
  >()

  async onInit() {
    this._handlePartitionAkariProtocol(AkariMainWindow.PARTITION)
    this._handlePartitionAkariProtocol(AkariAuxWindow.PARTITION)
    this._handlePartitionAkariProtocol(AkariOpggWindow.PARTITION)
  }

  async onDispose() {
    this._unhandlePartitionAkariProtocol(AkariMainWindow.PARTITION)
    this._unhandlePartitionAkariProtocol(AkariAuxWindow.PARTITION)
    this._unhandlePartitionAkariProtocol(AkariOpggWindow.PARTITION)
  }

  private _unhandlePartitionAkariProtocol(partition: string) {
    session.fromPartition(partition).protocol.unhandle(AkariProtocolMain.AKARI_PROXY_PROTOCOL)
  }

  private _handlePartitionAkariProtocol(partition: string) {
    session
      .fromPartition(partition)
      .protocol.handle(AkariProtocolMain.AKARI_PROXY_PROTOCOL, async (req) => {
        const path1 = req.url.slice(`${AkariProtocolMain.AKARI_PROXY_PROTOCOL}://`.length)
        const index = path1.indexOf('/')
        const domain = path1.slice(0, index).trim()
        const uri = path1.slice(index + 1).trim()

        const handler = this._domainRegistry.get(domain)
        if (handler) {
          return handler(uri, req)
        }

        return new Response(`No handler for ${req.url}`, {
          statusText: 'Not Found',
          headers: { 'Content-Type': 'text/plain' },
          status: 404
        })
      })
  }

  static convertWebStreamToNodeStream(readableStream: ReadableStream) {
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

  registerDomain(
    domain: string,
    handler: (uri: string, req: Request) => Promise<Response> | Response
  ) {
    if (this._domainRegistry.has(domain)) {
      throw new Error(`Domain ${domain} is already registered`)
    }

    this._domainRegistry.set(domain, handler)
  }

  unregisterDomain(domain: string) {
    if (!this._domainRegistry.has(domain)) {
      throw new Error(`Domain ${domain} is not registered`)
    }

    this._domainRegistry.delete(domain)
  }

  static register() {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: AkariProtocolMain.AKARI_PROXY_PROTOCOL,
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
}
