import { Overlay } from '@leaguetavern/electron-overlay-win'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AkariSharedGlobalShard, SHARED_GLOBAL_ID } from '@shared/akari-shard/manager'
import { BrowserWindow } from 'electron'

import { AkariProtocolMain } from '../akari-protocol'
import { AppCommonMain } from '../app-common'
import { GameClientMain } from '../game-client'
import { AkariIpcMain } from '../ipc'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AkariAuxWindow } from './aux-window/window'
import { AkariCdTimerWindow } from './cd-timer-window/windows'
import { AkariMainWindow } from './main-window/window'
import { AkariOngoingGameWindow } from './ongoing-game-window/window'
import { AkariOpggWindow } from './opgg-window/window'
import { WindowManagerSettings, WindowManagerState } from './state'

export interface WindowManagerMainContext {
  namespace: string
  windowManagerClass: typeof WindowManagerMain
  windowManager: WindowManagerMain
  app: AppCommonMain
  ipc: AkariIpcMain
  setting: SetterSettingService
  settingFactory: SettingFactoryMain
  loggerFactory: LoggerFactoryMain
  leagueClient: LeagueClientMain
  protocol: AkariProtocolMain
  mobx: MobxUtilsMain
  log: AkariLogger
  gameClient: GameClientMain
  keyboardShortcuts: KeyboardShortcutsMain
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
    'game-client-main',
    'akari-protocol-main',
    'keyboard-shortcuts-main',
    'app-common-main'
  ]

  public overlay: Overlay | null = null

  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger
  private readonly _settingFactory: SettingFactoryMain
  private readonly _setting: SetterSettingService
  private readonly _lc: LeagueClientMain
  private readonly _shared: AkariSharedGlobalShard
  private readonly _protocol: AkariProtocolMain
  private readonly _kbd: KeyboardShortcutsMain
  private readonly _app: AppCommonMain
  private readonly _gc: GameClientMain

  public readonly settings = new WindowManagerSettings()
  public readonly state = new WindowManagerState()

  public readonly mainWindow: AkariMainWindow
  public readonly auxWindow: AkariAuxWindow
  public readonly opggWindow: AkariOpggWindow
  public readonly ongoingGameWindow: AkariOngoingGameWindow
  public readonly cdTimerWindow: AkariCdTimerWindow

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
    this._kbd = deps['keyboard-shortcuts-main']
    this._app = deps['app-common-main']
    this._gc = deps['game-client-main']

    const wContext = this.getContext()
    this.mainWindow = new AkariMainWindow(wContext)
    this.auxWindow = new AkariAuxWindow(wContext)
    this.opggWindow = new AkariOpggWindow(wContext)
    this.ongoingGameWindow = new AkariOngoingGameWindow(wContext)
    this.cdTimerWindow = new AkariCdTimerWindow(wContext)
  }

  getContext(): WindowManagerMainContext {
    return {
      namespace: WindowManagerMain.id,
      windowManagerClass: WindowManagerMain,
      app: this._app,
      windowManager: this,
      ipc: this._ipc,
      setting: this._setting,
      settingFactory: this._settingFactory,
      loggerFactory: this._loggerFactory,
      leagueClient: this._lc,
      protocol: this._protocol,
      mobx: this._mobx,
      log: this._log,
      gameClient: this._gc,
      keyboardShortcuts: this._kbd
    }
  }

  async onInit() {
    await this._setting.applyToState()

    // disabled for now
    if (false && this._app.state.isAdministrator) {
      const { Overlay } = await import('@leaguetavern/electron-overlay-win')
      this.overlay = new Overlay()
    }

    if (this._shared.global.isWindows11_22H2_OrHigher) {
      this.state.setSupportsMica(true)
    }

    this._mobx.propSync(WindowManagerMain.id, 'state', this.state, ['supportsMica'])
    this._mobx.propSync(WindowManagerMain.id, 'settings', this.settings, ['backgroundMaterial'])

    this.mainWindow.on('force-close', () => {
      this.auxWindow.close(true)
      this.opggWindow.close(true)
      this.ongoingGameWindow.close(true)
      this.cdTimerWindow.close(true)
    })

    await this.mainWindow.onInit()
    await this.auxWindow.onInit()
    await this.opggWindow.onInit()
    await this.ongoingGameWindow.onInit()
    await this.cdTimerWindow.onInit()
  }

  async onFinish() {
    this._shared.global.events.on('second-instance', () => {
      this.mainWindow.showOrRestore()
    })
    this.state.setManagerFinishedInit(true)
    this.mainWindow.createWindow()
  }

  setAboveTheWorld(window: BrowserWindow) {
    const result = this.overlay?.enable(window.getNativeWindowHandle()) || {
      res: false,
      msg: 'NotEnabled'
    }
    return { res: result.res, msg: result.msg }
  }

  /**
   * 设置项的背景材质转换为原生系统级别背景材质
   */
  _settingToNativeBackgroundMaterial(material: string) {
    if (material === 'mica' && process.env['NODE_ENV'] !== 'development') {
      // fixed in v35.0.0, https://github.com/electron/electron/pull/45525
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
