import { LeagueAkariModule } from '@shared/akari/akari-module'
import { LeagueAkariModuleManager } from '@shared/akari/main-module-manager'
import dayjs from 'dayjs'
import { app, shell } from 'electron'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Logger, format, transports, createLogger as winstonCreateLogger } from 'winston'

import { appModule } from './app-new'

export class LogModule extends LeagueAkariModule {
  constructor() {
    super('log')
  }

  private _winstonLogger: Logger | null = null

  private _initialize() {
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

    this._winstonLogger = winstonCreateLogger({
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

    appModule.addQuitTask(
      () =>
        new Promise((resolve) => {
          if (this._winstonLogger) {
            this._winstonLogger.end(() => {
              resolve()
            })
          } else {
            resolve()
          }
        })
    )

    this.onCall('open-in-explorer/logs', () => {
      return shell.openPath(logsDir)
    })
  }

  createLogger(module: string) {
    const getLogger = () => {
      if (!this._winstonLogger) {
        throw new Error('logger is not initialized')
      }
      return this._winstonLogger
    }

    return {
      info: (message: any) => getLogger().info({ module, message }),
      warn: (message: any) => getLogger().warn({ module, message }),
      error: (message: any) => getLogger().error({ module, message }),
      debug: (message: any) => getLogger().debug({ module, message })
    }
  }

  override async onRegister(manager: LeagueAkariModuleManager) {
    await super.onRegister(manager)
    this._initialize()
  }
}
