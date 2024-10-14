import { BrowserWindow } from 'electron'

import { AkariIpcMain } from '../ipc'
import { AkariLoggerInstance, LoggerFactoryMain } from '../logger-factory'

/**
 * 管理了所有浏览器窗口, 这很伟大
 */
export class WindowManagerMain {
  static id = 'window-manager-main'

  static MW_PARTITION = 'persist:main-window'
  static AW_PARTITION = 'persist:persist:auxiliary-window'

  static dependencies = ['akari-ipc-main', 'logger-factory-main']

  private readonly _ipc: AkariIpcMain
  private readonly _log: AkariLoggerInstance
  private readonly _loggerFactory: LoggerFactoryMain

  private _mainWindow: BrowserWindow | null = null
  private _auxiliaryWindow: BrowserWindow | null = null

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(WindowManagerMain.id)
  }
}
