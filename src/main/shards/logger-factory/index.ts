import { AkariSharedGlobalShard, SHARED_GLOBAL_ID } from '@shared/akari-shard/manager'
import { formatError } from '@shared/utils/errors'
import { app, shell } from 'electron'
import { join } from 'node:path'
import { Logger } from 'winston'

export class AkariLogger {
  constructor(
    private readonly _logger: Logger,
    private readonly _namespace: string
  ) {}

  private _objectsToString(...args: any[]) {
    return args
      .map((arg) => {
        if (arg instanceof Error) {
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

  info(...args: any[]) {
    return this._logger.info({
      namespace: this._namespace,
      message: this._objectsToString(...args)
    })
  }

  warn(...args: any[]) {
    return this._logger.warn({
      namespace: this._namespace,
      message: this._objectsToString(...args)
    })
  }

  error(...args: any[]) {
    return this._logger.error({
      namespace: this._namespace,
      message: this._objectsToString(...args)
    })
  }

  debug(...args: any[]) {
    return this._logger.debug({
      namespace: this._namespace,
      message: this._objectsToString(...args)
    })
  }
}

/**
 * 创建日志记录器的工厂, 供给其他模块使用
 */
export class LoggerFactoryMain {
  static id = 'logger-factory-main'
  static dependencies = [SHARED_GLOBAL_ID]

  // 从全局注入的 logger 实例
  private readonly _logger: Logger
  private readonly _logsDir: string
  private readonly _appDir: string

  private readonly _shared: AkariSharedGlobalShard

  constructor(deps: any) {
    this._appDir = join(app.getPath('exe'), '..')
    this._logsDir = join(this._appDir, 'logs')
    this._shared = deps[SHARED_GLOBAL_ID]
    this._logger = this._shared.global.logger
  }

  openLogsDir() {
    return shell.openPath(this._logsDir)
  }

  /**
   * 创建一个日志记录器实例, 应该用于每个对应模块中
   * @param namespace
   * @returns
   */
  create(namespace: string) {
    return new AkariLogger(this._logger, namespace)
  }
}
