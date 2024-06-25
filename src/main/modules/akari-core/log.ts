import { LeagueAkariModule } from '@main/akari-ipc/akari-module'
import dayjs from 'dayjs'
import { app, shell } from 'electron'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Logger, createLogger, format, transports } from 'winston'

import { AppModule } from './app'

export type AppLogger = {
  info: (message: any) => Logger
  warn: (message: any) => Logger
  error: (message: any) => Logger
  debug: (message: any) => Logger
}

/**
 * 日志模块在构造时就初始化
 */
export class LogModule extends LeagueAkariModule {
  private _appModule: AppModule
  private _winstonLogger: Logger | null = null
  private _logDir: string
  private _appDir: string

  constructor() {
    super('log')

    this._appDir = join(app.getPath('exe'), '..')
    this._logDir = join(this._appDir, 'logs')

    this._initializeLogger()
  }

  async setup() {
    await super.setup()

    this._appModule = this.manager.getModule<AppModule>('app')
    this._appModule.addQuitTask(
      () =>
        new Promise((resolve) => {
          if (this._winstonLogger) {
            this._winstonLogger.end(() => {
              resolve()
              this._winstonLogger = null
            })
          } else {
            resolve()
          }
        })
    )

    this.onCall('open-in-explorer/logs', () => {
      return shell.openPath(this._logDir)
    })
  }

  openLogDir() {
    return shell.openPath(this._logDir)
  }

  /**
   * 创建一个日志工具，可在任何时候使用，无需 setup
   */
  createLogger(domain: string): AppLogger {
    const getLogger = () => {
      if (!this._winstonLogger) {
        throw new Error('logger is not initialized')
      }

      return this._winstonLogger
    }

    return {
      info: (message: any) => getLogger().info({ module: domain, message }),
      warn: (message: any) => getLogger().warn({ module: domain, message }),
      error: (message: any) => getLogger().error({ module: domain, message }),
      debug: (message: any) => getLogger().debug({ module: domain, message })
    }
  }

  private _initializeLogger() {
    const appDir = join(app.getPath('exe'), '..')
    const logsDir = join(appDir, 'logs')

    try {
      const stats = statSync(logsDir)

      if (!stats.isDirectory()) {
        rmSync(logsDir, { recursive: true, force: true })
        mkdirSync(logsDir)
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        mkdirSync(logsDir)
      } else {
        throw error
      }
    }

    this._winstonLogger = createLogger({
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, module, timestamp }) => {
          return `[${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss:SSS')}] [${module}] [${level}] ${message}`
        })
      ),
      transports: [
        new transports.File({
          filename: `LeagueAkari_${dayjs().format('YYYYMMDD_HHmmssSSS')}.log`,
          dirname: logsDir,
          level: 'info'
        }),
        new transports.Console({
          level: 'warn'
        })
      ]
    })
  }
}

export const logModule = new LogModule()
