import { Event } from 'electron'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { MainWindowSettings, MainWindowState } from './state'

export class AkariMainWindow extends BaseAkariWindow<MainWindowState, MainWindowSettings> {
  private _nextCloseAction: string | null = null

  constructor(_context: WindowManagerMainContext) {
    const state = new MainWindowState()
    const settings = new MainWindowSettings()

    super(_context, 'main-window', state, settings, {
      baseWidth: 1380,
      baseHeight: 860,
      minWidth: 840,
      minHeight: 600,
      htmlEntry: 'main-window.html',
      rememberPosition: false,
      rememberSize: true,
      settingSchema: {
        closeAction: { default: settings.closeAction }
      },
      browserWindowOptions: {
        title: 'League Akari',
        icon: icon,
        show: false,
        frame: false,
        fullscreenable: true,
        maximizable: true
      }
    })
  }

  private _handleMainWindowLogics() {
    this._mobx.reaction(
      () => this.state.ready,
      (ready) => {
        if (ready) {
          this.showOrRestore()
        }
      }
    )
  }

  private _handleMainWindowIpcCall() {
    this._ipc.onCall(this._namespace, 'closeMainWindow', async (_, strategy) => {
      this._nextCloseAction = strategy
      this._window?.close()
    })
  }

  protected override handleClose(event: Event) {
    if (this._forceClose) {
      this.emit('force-close') // when main window is closed, close aux window
      return
    }

    const s = this._nextCloseAction || this.settings.closeAction

    if (s === 'minimize-to-tray') {
      event.preventDefault()
      this._window?.hide()
    } else if (s === 'ask') {
      event.preventDefault()

      if (!this.state.show) {
        this._window?.show()
      }

      this._context.ipc.sendEvent(this._namespace, 'close-asking')
      this.showOrRestore()
    } else {
      this.close(true)
    }

    this._nextCloseAction = null
  }

  protected override getSettingPropKeys() {
    return ['closeAction'] as const
  }

  override async onInit() {
    await super.onInit()

    this._handleMainWindowLogics()
    this._handleMainWindowIpcCall()
  }
}
