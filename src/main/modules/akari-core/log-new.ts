import { LeagueAkariModule } from '@shared/akari/akari-module'
import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import dayjs from 'dayjs'
import { app, shell } from 'electron'
import { makeAutoObservable, observable } from 'mobx'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Logger, createLogger, format, transports } from 'winston'

import { AppModule } from './app-new'

class AppSettings {
  /**
   * 在客户端启动时且只有唯一的客户端，尝试自动连接
   */
  autoConnect: boolean = true

  /**
   * 使用 WMIC 查询命令行，而不是默认的 NtQueryInformationProcess
   */
  useWmic: boolean = false

  /**
   * 从 Github 拉取更新信息
   */
  autoCheckUpdates: boolean = true

  /**
   * 输出前置声明
   */
  showFreeSoftwareDeclaration: boolean = true

  /**
   * 关闭应用的默认行为
   */
  closeStrategy: MainWindowCloseStrategy = 'unset'

  setAutoConnect(enabled: boolean) {
    this.autoConnect = enabled
  }

  setUseWmic(enabled: boolean) {
    this.useWmic = enabled
  }

  setAutoCheckUpdates(enabled: boolean) {
    this.autoCheckUpdates = enabled
  }

  setShowFreeSoftwareDeclaration(enabled: boolean) {
    this.showFreeSoftwareDeclaration = enabled
  }

  setCloseStrategy(s: MainWindowCloseStrategy) {
    this.closeStrategy = s
  }

  constructor() {
    makeAutoObservable(this)
  }
}

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

export class AppState {
  isAdministrator: boolean = false

  ready: boolean = false

  updates = observable(
    {
      isCheckingUpdates: false,
      lastCheckAt: null as Date | null,
      newUpdates: null as NewUpdates | null
    },
    {
      newUpdates: observable.ref
    }
  )

  settings = new AppSettings()

  constructor() {
    makeAutoObservable(this)
  }

  setElevated(b: boolean) {
    this.isAdministrator = b
  }

  setReady(b: boolean) {
    this.ready = b
  }
}

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
