import { optimizer } from '@electron-toolkit/utils'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { BrowserWindow, app } from 'electron'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { WindowManagerSettings } from './state'

export class WindowManagerMain implements IAkariShardInitDispose {
  static id = 'window-manager-main'
  static dependencies = [
    'akari-ipc-main',
    'mobx-utils-main',
    'logger-factory-main',
    'setting-factory-main'
  ]

  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain
  private readonly _log: AkariLogger
  private readonly _setting: MobxSettingService

  public readonly settings = new WindowManagerSettings()

  constructor(deps: {
    'akari-ipc-main': AkariIpcMain
    'mobx-utils-main': MobxUtilsMain
    'logger-factory-main': LoggerFactoryMain
    'setting-factory-main': SettingFactoryMain
  }) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._log = deps['logger-factory-main'].create(WindowManagerMain.id)
    this._setting = deps['setting-factory-main'].create(
      WindowManagerMain.id,
      {
        autoShowAuxWindow: { default: true },
        mainWindowCloseAction: { default: 'ask' }
      },
      this.settings
    )
  }

  // private readonly _mainWindow: MainWindowMain
  // private readonly _auxWindow: AuxWindowMain

  // constructor(deps: any) {
  //   this._mainWindow = deps['main-window-main']
  //   this._auxWindow = deps['aux-window-main']
  // }

  async onInit() {
    await this._setting.applyToState()
    this._mobx.propSync(WindowManagerMain.id, 'settings', this.settings, [
      'autoShowAuxWindow',
      'mainWindowCloseAction'
    ])
  }
}
