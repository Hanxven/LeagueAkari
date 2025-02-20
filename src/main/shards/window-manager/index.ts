import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AkariSharedGlobalShard, SHARED_GLOBAL_ID } from '@shared/akari-shard/manager'
import { BrowserWindow, Display, screen } from 'electron'

import { AkariProtocolMain } from '../akari-protocol'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AkariAuxWindow } from './aux-window/window'
import { AkariMainWindow } from './main-window/window'
import { AkariOpggWindow } from './opgg-window/window'
import { WindowManagerSettings, WindowManagerState } from './state'

export interface WindowManagerMainContext {
  namespace: string
  windowManagerClass: typeof WindowManagerMain
  windowManager: WindowManagerMain
  ipc: AkariIpcMain
  setting: SetterSettingService
  settingFactory: SettingFactoryMain
  loggerFactory: LoggerFactoryMain
  leagueClient: LeagueClientMain
  protocol: AkariProtocolMain
  mobx: MobxUtilsMain
  log: AkariLogger
}

export class WindowManagerMain implements IAkariShardInitDispose {
  static id = 'window-manager-main'
  static dependencies = [
    SHARED_GLOBAL_ID,
    'akari-ipc-main',
    'mobx-utils-main',
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main',
    'akari-protocol-main'
  ]

  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger
  private readonly _settingFactory: SettingFactoryMain
  private readonly _setting: SetterSettingService
  private readonly _lc: LeagueClientMain
  private readonly _shared: AkariSharedGlobalShard
  private readonly _protocol: AkariProtocolMain

  public readonly settings = new WindowManagerSettings()
  public readonly state = new WindowManagerState()

  public readonly mainWindow: AkariMainWindow
  public readonly auxWindow: AkariAuxWindow
  public readonly opggWindow: AkariOpggWindow

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._shared = deps[SHARED_GLOBAL_ID]
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(WindowManagerMain.id)
    this._settingFactory = deps['setting-factory-main']
    this._setting = this._settingFactory.register(
      WindowManagerMain.id,
      {
        backgroundMaterial: { default: this.settings.backgroundMaterial }
      },
      this.settings
    )
    this._lc = deps['league-client-main']
    this._protocol = deps['akari-protocol-main']

    const wContext = this.getContext()
    this.mainWindow = new AkariMainWindow(wContext)
    this.auxWindow = new AkariAuxWindow(wContext)
    this.opggWindow = new AkariOpggWindow(wContext)
  }

  getContext(): WindowManagerMainContext {
    return {
      namespace: WindowManagerMain.id,
      windowManagerClass: WindowManagerMain,
      windowManager: this,
      ipc: this._ipc,
      setting: this._setting,
      settingFactory: this._settingFactory,
      loggerFactory: this._loggerFactory,
      leagueClient: this._lc,
      protocol: this._protocol,
      mobx: this._mobx,
      log: this._log
    }
  }

  async onInit() {
    await this._setting.applyToState()

    if (this._shared.global.isWindows11_22H2_OrHigher) {
      this.state.setSupportsMica(true)
    }

    this._mobx.propSync(WindowManagerMain.id, 'state', this.state, ['supportsMica'])
    this._mobx.propSync(WindowManagerMain.id, 'settings', this.settings, ['backgroundMaterial'])

    this.mainWindow.on('force-close', () => {
      this.auxWindow.close(true)
      this.opggWindow.close(true)
    })

    await this.mainWindow.onInit()
    await this.auxWindow.onInit()
    await this.opggWindow.onInit()
  }

  async onFinish() {
    this._shared.global.events.on('second-instance', () => {
      this.mainWindow.showOrRestore()
    })
    this.state.setShardsReady(true)
    this.mainWindow.createWindow()
  }

  /**
   * 设置项的背景材质转换为原生系统级别背景材质
   */
  _settingToNativeBackgroundMaterial(material: string) {
    if (material === 'mica' && process.env['NODE_ENV'] !== 'development') {
      this._log.warn(
        'Mica is disabled in production mode. (https://github.com/electron/electron/issues/41824)'
      )
      return 'none'
    }

    if (!this.state.supportsMica) {
      return 'none'
    }

    if (material === 'mica') {
      return 'mica'
    }

    return 'none'
  }
}
