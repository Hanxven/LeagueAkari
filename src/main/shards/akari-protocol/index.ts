import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AxiosRequestConfig } from 'axios'
import { protocol, session } from 'electron'
import { Mime } from 'mime'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'

import { LeagueClientLcuUninitializedError, LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { RiotClientMain, RiotClientRcuUninitializedError } from '../riot-client'
import { WindowManagerMain } from '../window-manager'

/**
 * 实现 `akari://` 协议, 用户特殊资源的代理
 * akari://league-client/* 代理到 LeagueClient 的 HTTP 服务
 * akari://riot-client/* 代理到 RiotClient 的 HTTP 服务
 * akari://file/ 代理到本地文件系统 (实验性特性, 危险)
 */
export class AkariProtocolMain implements IAkariShardInitDispose {
  static id = 'akari-protocol-main'
  static dependencies = ['league-client-main', 'riot-client-main', 'logger-factory-main']

  static AKARI_PROXY_PROTOCOL = 'akari'

  private readonly _leagueClient: LeagueClientMain
  private readonly _riotClient: RiotClientMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger

  private _mime: Mime
  private _rendererDirPath: string

  constructor(deps: any) {
    this._leagueClient = deps['league-client-main']
    this._riotClient = deps['riot-client-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(AkariProtocolMain.id)
  }

  async onInit() {
    this._mime = (await import('mime')).default
    this._rendererDirPath = path.join(__dirname, '../renderer')
    this._handleFileProtocol(WindowManagerMain.MAIN_WINDOW_PARTITION)
    this._handlePartitionAkariProtocol(WindowManagerMain.MAIN_WINDOW_PARTITION)
    this._handlePartitionAkariProtocol(WindowManagerMain.AUX_WINDOW_PARTITION)
  }

  async onDispose() {
    this._unhandlePartitionAkariProtocol(WindowManagerMain.MAIN_WINDOW_PARTITION)
    this._unhandlePartitionAkariProtocol(WindowManagerMain.AUX_WINDOW_PARTITION)
  }

  private _unhandlePartitionAkariProtocol(partition: string) {
    session.fromPartition(partition).protocol.unhandle(AkariProtocolMain.AKARI_PROXY_PROTOCOL)
  }

  private _handleFileProtocol(partition: string) {
    session.fromPartition(partition).protocol.handle('akari-file', (req) => {
      // file:///D:/Projects/league-akari/dist/win-unpacked/resources/app.asar/out/renderer/main-window.html 类似于这样的
      console.log(req, decodeURIComponent(req.url))
      const filePath = req.url.slice('akari-file://'.length)
      return new Response(fs.createReadStream(filePath))
    })
  }

  private _handlePartitionAkariProtocol(partition: string) {
    session
      .fromPartition(partition)
      .protocol.handle(AkariProtocolMain.AKARI_PROXY_PROTOCOL, async (req) => {
        const path1 = req.url.slice(`${AkariProtocolMain.AKARI_PROXY_PROTOCOL}://`.length)
        const index = path1.indexOf('/')
        const domain = path1.slice(0, index).trim()
        const uri = path1.slice(index + 1).trim()

        switch (domain) {
          case 'league-client':
          case 'riot-client':
            const reqHeaders: Record<string, string> = {}
            req.headers.forEach((value, key) => {
              reqHeaders[key] = value
            })

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
                error instanceof LeagueClientLcuUninitializedError ||
                error instanceof RiotClientRcuUninitializedError
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

          case 'file':
            return this._toLocalFileResponse(uri)

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

  private async _checkFileAccess(filePath: string) {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK)
      const stats = await fs.promises.stat(filePath)

      if (stats.isDirectory()) {
        return ['dir', stats] as const
      }

      return ['file', stats] as const
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return ['not-found', error] as const
      } else if ((error as any).code === 'EACCES') {
        return ['forbidden', error] as const
      } else {
        return ['error', error] as const
      }
    }
  }

  private async _toLocalFileResponse(uri: string) {
    const filePath = path.resolve(uri)

    try {
      await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK)

      const stats = await fs.promises.stat(filePath)

      if (stats.isDirectory()) {
        return new Response(`Cannot read directory: ${uri}`, {
          headers: { 'Content-Type': 'text/plain' },
          status: 403
        })
      }

      return new Response(fs.createReadStream(filePath), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          Connection: 'keep-alive',
          'Content-Type': this._mime.getType(filePath) || 'application/octet-stream',
          'Cache-Control': 'no-cache',
          'Content-Length': stats.size.toString(),
          Date: new Date().toUTCString()
        }
      })
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return new Response((error as Error).message, {
          headers: { 'Content-Type': 'text/plain' },
          status: 404
        })
      } else if ((error as any).code === 'EACCES') {
        return new Response((error as Error).message, {
          headers: { 'Content-Type': 'text/plain' },
          status: 403
        })
      } else {
        return new Response((error as Error).message, {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    }
  }

  /**
   * 暂未实装
   * @returns
   */
  private async _toSpaAssetsResponse(base: string, uri: string, defaultFile: string) {
    const actualPath = path.resolve(base, uri)

    const [result, statsOrError] = await this._checkFileAccess(actualPath)

    if (result === 'file') {
      return new Response(fs.createReadStream(actualPath), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': this._mime.getType(actualPath) || 'application/octet-stream',
          'Cache-Control': 'no-cache',
          'Content-Length': statsOrError.size.toString(),
          Date: new Date().toUTCString()
        }
      })
    } else if (result === 'not-found') {
      const defaultPath = path.resolve(base, defaultFile)

      if (defaultPath === actualPath) {
        return new Response(`Not found: ${actualPath}`, {
          headers: { 'Content-Type': 'text/plain' },
          status: 404
        })
      }

      const [result, statsOrError] = await this._checkFileAccess(defaultPath)

      if (result === 'file') {
        return new Response(fs.createReadStream(defaultPath), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': this._mime.getType(defaultPath) || 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Content-Length': statsOrError.size.toString(),
            Date: new Date().toUTCString()
          }
        })
      } else if (result === 'not-found') {
        return new Response(`Not found: ${defaultFile}`, {
          headers: { 'Content-Type': 'text/plain' },
          status: 404
        })
      } else if (result === 'dir' || result === 'forbidden') {
        return new Response(
          result === 'dir'
            ? `Cannot read directory: ${defaultFile}`
            : `Cannot access: ${defaultFile}`,
          {
            headers: { 'Content-Type': 'text/plain' },
            status: 403
          }
        )
      } else {
        return new Response((statsOrError as Error).message, {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    } else if (result === 'dir' || result === 'forbidden') {
      const defaultPath = path.resolve(actualPath, defaultFile)
      const [result, _] = await this._checkFileAccess(defaultPath)

      if (result === 'file') {
        return new Response(fs.createReadStream(defaultPath), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': this._mime.getType(defaultPath) || 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Content-Length': (await fs.promises.stat(defaultPath)).size.toString(),
            Date: new Date().toUTCString()
          }
        })
      } else {
        return new Response(
          result === 'dir'
            ? `Cannot read directory: ${actualPath}`
            : `Cannot access: ${actualPath}`,
          {
            headers: { 'Content-Type': 'text/plain' },
            status: 403
          }
        )
      }
    } else {
      return new Response((statsOrError as Error).message, {
        headers: { 'Content-Type': 'text/plain' },
        status: 500
      })
    }
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
