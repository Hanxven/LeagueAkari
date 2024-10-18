import { optimizer } from '@electron-toolkit/utils'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { BrowserWindow, app } from 'electron'

import { AkariIpcMain } from '../ipc'
import { AkariLogger } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { WindowManagerSettings } from './state'

export class WindowManagerMain implements IAkariShardInitDispose {
  static id = 'window-manager-main'
  static dependencies = ['akari-ipc-main', 'mobx-utils-main', 'logger-factory-main']

  private _ipc: AkariIpcMain
  private _mobx: MobxUtilsMain
  private _log: AkariLogger

  public readonly settings = new WindowManagerSettings()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._log = deps['logger-factory-main'].create(WindowManagerMain.id)
  }

  // private readonly _mainWindow: MainWindowMain
  // private readonly _auxWindow: AuxWindowMain

  // constructor(deps: any) {
  //   this._mainWindow = deps['main-window-main']
  //   this._auxWindow = deps['aux-window-main']
  // }

  async onInit() {}
}
