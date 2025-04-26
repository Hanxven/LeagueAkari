import { Shard } from '@shared/akari-shard'
import { protocol, session } from 'electron'
import ofs from 'node:original-fs'
import path from 'node:path'
import { Readable } from 'node:stream'

/**
 * 实现 `akari://` 协议, 用户特殊资源的代理
 * akari://local/* 代理到本地文件系统
 * akari://league-client/* 代理到 LeagueClient 的 HTTP 服务
 * akari://riot-client/* 代理到 RiotClient 的 HTTP 服务
 */
@Shard(AkariProtocolMain.id)
export class AkariProtocolMain {
  static id = 'akari-protocol-main'

  static AKARI_PROXY_PROTOCOL = 'akari'

  private readonly _domainRegistry = new Map<
    string,
    (uri: string, req: Request) => Promise<Response> | Response
  >()

  private readonly _partitionRegistry = new Set<string>()

  onInit() {
    const mime = require('mime-types')

    this.registerDomain('local', async (uri: string, _req: Request) => {
      const filePath = decodeURIComponent(uri)
      try {
        await ofs.promises.access(filePath, ofs.constants.R_OK)
        const stream = ofs.createReadStream(path.normalize(filePath))
        const contentType = mime.lookup(filePath) || 'application/octet-stream'
        return new Response(stream, {
          status: 200,
          headers: { 'Content-Type': contentType }
        })
      } catch (error: any) {
        switch (error.code) {
          case 'ENOENT':
            return new Response(
              JSON.stringify({
                error: error.message,
                filepath: filePath
              }),
              {
                statusText: 'Not Found',
                headers: { 'Content-Type': 'application/json' },
                status: 404
              }
            )
          case 'EACCES':
            return new Response(
              JSON.stringify({
                error: error.message,
                filepath: filePath
              }),
              {
                statusText: 'Forbidden',
                headers: { 'Content-Type': 'application/json' },
                status: 403
              }
            )
          default:
            return new Response(
              JSON.stringify({
                error: error.message,
                filepath: filePath
              }),
              {
                statusText: 'Internal Server Error',
                headers: { 'Content-Type': 'application/json' },
                status: 500
              }
            )
        }
      }
    })
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

  static convertWebStreamToNodeStream(readableStream: ReadableStream): Readable {
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

  static convertNodeStreamToWebStream(nodeStream: Readable): ReadableStream {
    return new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk))
        nodeStream.on('end', () => controller.close())
        nodeStream.on('rejected', (err) => controller.error(err))
      },
      cancel(reason) {
        nodeStream.destroy(reason)
      }
    })
  }

  registerPartition(partition: string) {
    if (this._partitionRegistry.has(partition)) {
      throw new Error(`Partition ${partition} is already registered`)
    }

    this._partitionRegistry.add(partition)
    this._handlePartitionAkariProtocol(partition)
  }

  unregisterPartition(partition: string) {
    if (!this._partitionRegistry.has(partition)) {
      throw new Error(`Partition ${partition} is not registered`)
    }

    this._partitionRegistry.delete(partition)
    this._unhandlePartitionAkariProtocol(partition)
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
