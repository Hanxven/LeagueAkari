import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { BrowserWindow } from 'electron'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { MainWindowState } from './state'

export class AuxWindowMain implements IAkariShardInitDispose {
  static id = 'aux-window-main'
  static dependencies = [
    'akari-ipc-main',
    'mobx-utils-main',
    'app-common-main',
    'logger-factory-main',
    'setting-factory-main'
  ]

  static INITIAL_SHOW = false
  static PARTITION = 'persist:main-window'
  static WINDOW_DEFAULT_SIZE = [1256, 780] as [number, number]
  static WINDOW_MIN_SIZE = [800, 600] as [number, number]

  public readonly state = new MainWindowState()

  private readonly _ipc: AkariIpcMain
  private readonly _common: AppCommonMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger
  private readonly _mobx: MobxUtilsMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _setting: MobxSettingService

  private _w: BrowserWindow | null = null

  private _nextCloseAction: string | null = null
  private _willClose = false

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._common = deps['app-common-main']
    this._loggerFactory = deps['logger-factory-main']
    this._mobx = deps['mobx-utils-main']
    this._settingFactory = deps['setting-factory-main']
    this._log = this._loggerFactory.create(AuxWindowMain.id)
    this._setting = this._settingFactory.create(AuxWindowMain.PARTITION, {}, {})
  }

  async onInit() {
    this._handleWindowSizeTrack()
  }

  private _handleCloseEvent(event: Event) {
    if (this._willClose) {
      // this._awm.closeWindow(true)
      return
    }

    if (!this._w) {
      return
    }

    const s = this._nextCloseAction || this._common.state.settings.mainWindowCloseStrategy

    if (s === 'minimize-to-tray') {
      event.preventDefault()
      this._w.hide()
    } else if (s === 'unset') {
      event.preventDefault()

      if (!this.state.isShow) {
        this._w.show()
      }

      this._ipc.sendEvent(AuxWindowMain.id, 'close-asking')
      this.restoreAndFocus()
    } else {
      this._willClose = true
      this._w.close()

      this._log.info('MainWindow Close -> 将关闭主窗口')
    }

    this._nextCloseAction = null
  }

  private _handleWindowSizeTrack() {
    this._mobx.reaction(
      () => this.state.windowSize,
      (size) => {
        size[0] = Math.max(size[0], AuxWindowMain.WINDOW_MIN_SIZE[0])
        size[1] = Math.max(size[1], AuxWindowMain.WINDOW_MIN_SIZE[1])
        this._setting._saveToStorage('windowSize', size)
      },
      { delay: 500 }
    )
  }

  restoreAndFocus() {
    if (this._w) {
      if (!this.state.isShow) {
        this._w.show()
        this._w.focus()
        return
      }

      if (this._w.isMinimized()) {
        this._w.restore()
      }

      this._w.focus()
    }
  }

  toggleMinimizedAndFocused() {
    if (this._w) {
      if (!this.state.isShow) {
        this._w.show()
        this._w.focus()
        return
      }

      if (this._w.isMinimized()) {
        this._w.restore()
        this._w.focus()
      } else {
        this._w.minimize()
      }
    }
  }
}
