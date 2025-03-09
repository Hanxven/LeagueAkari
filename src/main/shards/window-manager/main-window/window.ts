import { Event } from 'electron'
import { comparer } from 'mobx'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { MainWindowSettings, MainWindowState } from './state'

export class AkariMainWindow extends BaseAkariWindow<MainWindowState, MainWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'main-window'
  static readonly HTML_ENTRY = 'main-window.html'
  static readonly TITLE = 'League Akari'
  static readonly BASE_WIDTH = 1380
  static readonly BASE_HEIGHT = 860
  static readonly MIN_WIDTH = 840
  static readonly MIN_HEIGHT = 600

  private _nextCloseAction: string | null = null

  constructor(_context: WindowManagerMainContext) {
    const state = new MainWindowState()
    const settings = new MainWindowSettings()

    super(_context, AkariMainWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariMainWindow.BASE_WIDTH,
      baseHeight: AkariMainWindow.BASE_HEIGHT,
      minWidth: AkariMainWindow.MIN_WIDTH,
      minHeight: AkariMainWindow.MIN_HEIGHT,
      htmlEntry: AkariMainWindow.HTML_ENTRY,
      rememberPosition: false,
      rememberSize: true,
      settingSchema: {
        closeAction: { default: settings.closeAction }
      },
      browserWindowOptions: {
        title: AkariMainWindow.TITLE,
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

    this._mobx.reaction(
      () => [this._windowManager.settings.backgroundMaterial, this.state.ready] as const,
      ([material, ready]) => {
        if (ready) {
          this._window?.setBackgroundMaterial(
            this._windowManager._settingToNativeBackgroundMaterial(material)
          )
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
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
