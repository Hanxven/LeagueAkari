import { Overlay } from '@leaguetavern/electron-overlay-win'
import { GameClientMain } from '@main/shards/game-client'
import { Event } from 'electron'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { OngoingGameOverlayWindowSettings, OngoingGameOverlayWindowState } from './state'

export class AkariOngoingGameOverlayWindow extends BaseAkariWindow<
  OngoingGameOverlayWindowState,
  OngoingGameOverlayWindowSettings
> {
  static readonly NAMESPACE_SUFFIX = 'ongoing-game-overlay-window'
  static readonly HTML_ENTRY = 'main-window.html'
  static readonly HTML_ENTRY_HASH = 'ongoing-game/overlay'
  static readonly TITLE = 'Akari Overlay'
  static readonly BASE_WIDTH = 1500
  static readonly BASE_HEIGHT = 860

  static readonly _overlay: Overlay = new Overlay()

  // unused yet
  private readonly _timer: NodeJS.Timeout

  private _visible: boolean = false

  constructor(_context: WindowManagerMainContext) {
    const state = new OngoingGameOverlayWindowState()
    const settings = new OngoingGameOverlayWindowSettings()

    super(_context, AkariOngoingGameOverlayWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariOngoingGameOverlayWindow.BASE_WIDTH,
      baseHeight: AkariOngoingGameOverlayWindow.BASE_HEIGHT,
      minWidth: AkariOngoingGameOverlayWindow.BASE_WIDTH,
      minHeight: AkariOngoingGameOverlayWindow.BASE_HEIGHT,
      htmlEntry: {
        path: AkariOngoingGameOverlayWindow.HTML_ENTRY,
        hash: AkariOngoingGameOverlayWindow.HTML_ENTRY_HASH
      },
      rememberPosition: false,
      settingSchema: {},
      browserWindowOptions: {
        title: AkariOngoingGameOverlayWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        resizable: false,
        focusable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        autoHideMenuBar: true,
        backgroundColor: '#00000000'
      }
    })
    this._timer = setInterval(() => {
      if (!GameClientMain.isGameClientForeground() && this._visible) {
        this.hide()
      }
    }, 200)
  }

  private _handleOverlayWindowLogics() {
    this._mobx.reaction(
      () => this.state.ready,
      (ready) => {
        if (!ready) {
          return
        }
        this._setTop()
      }
    )
  }

  protected override handleClose(event: Event) {
    if (this._forceClose) {
      this.emit('force-close')
      return
    }

    this.close(true)
  }

  protected override getSettingPropKeys() {
    return []
  }

  override async onInit() {
    await super.onInit()

    this._handleOverlayWindowLogics()
  }

  public toggleVisible() {
    if (GameClientMain.isGameClientForeground()) {
      this._visible ? this._hideOverlay() : this._showOverlay()
    }
  }

  _setTop() {
    if (
      this.window &&
      !AkariOngoingGameOverlayWindow._overlay.enable(this.window.getNativeWindowHandle()).res
    ) {
      this._log.warn('Overlay 无法初始化')
      this.close()
      return
    }
  }

  _toggleClickThrough(value: boolean) {
    if (value) {
      this.window?.setIgnoreMouseEvents(true, { forward: true })
    } else {
      this.window?.setIgnoreMouseEvents(false)
    }
  }

  _showOverlay() {
    if (!this._visible) {
      this.window?.setBounds({
        width: AkariOngoingGameOverlayWindow.BASE_WIDTH,
        height: AkariOngoingGameOverlayWindow.BASE_HEIGHT
      })
      this.window?.center()
      this.showOrRestore()
      this._toggleClickThrough(true)
      this._visible = true
    }
  }

  _hideOverlay() {
    if (this._visible) {
      // bug: https://github.com/electron/electron/issues/42772
      // 目前的解决方案是缩小到左上角进行隐藏, 需要时再转换回来
      this.window?.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      this.hide()
      this._visible = false
    }
  }
}
