import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { formatError } from '@shared/utils/errors'
import { app, shell } from 'electron'
import path from 'node:path'
import { Logger } from 'winston'

import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { LoggerFactoryState } from './state'

export class AkariLogger {
  constructor(
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _namespace: string
  ) {}

  info(...args: any[]) {
    return this._loggerFactory.info(this._namespace, ...args)
  }

  warn(...args: any[]) {
    return this._loggerFactory.warn(this._namespace, ...args)
  }

  error(...args: any[]) {
    return this._loggerFactory.error(this._namespace, ...args)
  }

  debug(...args: any[]) {
    return this._loggerFactory.debug(this._namespace, ...args)
  }
}

/**
 * 创建日志记录器的工厂, 供给其他模块使用
 */
@Shard(LoggerFactoryMain.id)
export class LoggerFactoryMain implements IAkariShardInitDispose {
  static id = 'logger-factory-main'

  public readonly state = new LoggerFactoryState()

  // 从全局注入的 logger 实例
  private readonly _logger: Logger
  private readonly _logsDir: string
  private readonly _appDir: string

  constructor(
    private readonly _shared: SharedGlobalShard,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobx: MobxUtilsMain
  ) {
    this._appDir = path.join(app.getPath('exe'), '..')
    this._logsDir = path.join(this._appDir, 'logs')
    this._logger = this._shared.global.logger

    this.state.setLogLevel(this._shared.global.getLogLevel())

    this._shared.global.events.on('log-level-changed', (level) => {
      this.state.setLogLevel(level)
    })
  }

  private _objectsToString(...args: any[]) {
    return args
      .map((arg) => {
        if (arg instanceof Error || this._isLikelyErrorObject(arg)) {
          return formatError(arg)
        }

        if (typeof arg === 'undefined') {
          return 'undefined'
        }

        if (typeof arg === 'function') {
          return arg.toString()
        }

        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (error) {
            return arg.toString()
          }
        }

        return arg
      })
      .join(' ')
  }

  private _isLikelyErrorObject(obj: any) {
    if (!obj || typeof obj !== 'object') {
      return false
    }

    const props = Object.getOwnPropertyNames(obj)

    const hasStack = props.includes('stack') && typeof obj.stack === 'string'
    const hasMessage = props.includes('message') && typeof obj.message === 'string'

    if (hasStack || hasMessage) {
      return true
    }

    return false
  }

  openLogsDir() {
    return shell.showItemInFolder(path.join(this._logsDir, this._shared.global.logFilename))
  }

  /**
   * 创建一个日志记录器实例, 应该用于每个对应模块中
   * @param namespace
   * @returns
   */
  create(namespace: string) {
    return new AkariLogger(this, namespace)
  }

  info(namespace: string, ...args: any[]) {
    return this._logger.info({
      namespace: namespace,
      message: this._objectsToString(...args)
    })
  }

  warn(namespace: string, ...args: any[]) {
    return this._logger.warn({
      namespace: namespace,
      message: this._objectsToString(...args)
    })
  }

  error(namespace: string, ...args: any[]) {
    return this._logger.error({
      namespace: namespace,
      message: this._objectsToString(...args)
    })
  }

  debug(namespace: string, ...args: any[]) {
    return this._logger.debug({
      namespace: namespace,
      message: this._objectsToString(...args)
    })
  }

  async onInit() {
    this._mobx.propSync(LoggerFactoryMain.id, 'state', this.state, 'logLevel')

    this._ipc.onCall(
      LoggerFactoryMain.id,
      'log',
      (_, namespace: string, level: string, ...args: any[]) => {
        switch (level) {
          case 'info':
            this.info(namespace, ...args)
            return
          case 'warn':
            this.warn(namespace, ...args)
            return
          case 'error':
            this.error(namespace, ...args)
            return
          case 'debug':
            this.debug(namespace, ...args)
            return
          default:
            this.info(namespace, ...args)
        }
      }
    )

    this._ipc.onCall(LoggerFactoryMain.id, 'setLogLevel', (_, level: string) => {
      this.info(LoggerFactoryMain.id, `Setting log level to ${level}`)
      this._shared.global.setLogLevel(level)
    })

    this._ipc.onCall(LoggerFactoryMain.id, 'openLogsDir', () => {
      this.openLogsDir()
    })
  }
}
