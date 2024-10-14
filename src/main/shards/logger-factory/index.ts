import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import dayjs from 'dayjs'
import { app, shell } from 'electron'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Logger, createLogger, format, transports } from 'winston'

export type AkariLoggerInstance = {
  info: (message: any) => Logger
  warn: (message: any) => Logger
  error: (message: any) => Logger
  debug: (message: any) => Logger
}

/**
 * 创建日志记录器的工厂, 供给其他模块使用
 */
export class LoggerFactoryMain implements IAkariShardInitDispose {
  static id = 'logger-factory-main'

  private _loggerInstance: Logger | null = null

  private readonly _logsDir: string
  private readonly _appDir: string

  async onInit() {
    this._initializeLogger()
  }

  constructor() {
    this._appDir = join(app.getPath('exe'), '..')
    this._logsDir = join(this._appDir, 'logs')
  }

  openLogsDir() {
    return shell.openPath(this._logsDir)
  }

  private _initializeLogger() {
    try {
      const stats = statSync(this._logsDir)

      if (!stats.isDirectory()) {
        rmSync(this._logsDir, { recursive: true, force: true })
        mkdirSync(this._logsDir)
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        mkdirSync(this._logsDir)
      } else {
        throw error
      }
    }

    this._loggerInstance = createLogger({
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, namespace, timestamp }) => {
          return `[${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss:SSS')}] [${namespace}] [${level}] ${message}`
        })
      ),
      transports: [
        new transports.File({
          filename: `LeagueAkari_${dayjs().format('YYYYMMDD_HHmmssSSS')}.log`,
          dirname: this._logsDir,
          level: 'info'
        }),
        new transports.Console({
          level: import.meta.env.DEV ? 'info' : 'warn'
        })
      ]
    })
  }

  /**
   * 创建一个日志记录器实例, 应该用于每个对应模块中
   * @param namespace
   * @returns
   */
  create(namespace: string): AkariLoggerInstance {
    const getLogger = () => {
      if (!this._loggerInstance) {
        throw new Error('logger is not initialized')
      }

      return this._loggerInstance
    }

    const info = (message: any) => {
      return getLogger().info({ namespace, message })
    }

    const warn = (message: any) => {
      return getLogger().warn({ namespace, message })
    }

    const error = (message: any) => {
      return getLogger().error({ namespace, message })
    }

    const debug = (message: any) => {
      return getLogger().debug({ namespace, message })
    }

    return { info, warn, error, debug }
  }
}
