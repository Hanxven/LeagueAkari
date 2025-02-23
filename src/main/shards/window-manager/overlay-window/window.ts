import { BrowserWindow, Event } from 'electron'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { OverlayWindowSettings, OverlayWindowState } from './state'
import { GameClientMain } from '@main/shards/game-client'
import { Overlay } from '@leaguetavern/electron-overlay-win'

export class AkariOverlayWindow extends BaseAkariWindow<OverlayWindowState, OverlayWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'overlay-window'
  static readonly HTML_ENTRY = 'main-window.html'
  static readonly HTML_ENTRY_HASH = 'ongoing-game/overlay'
  static readonly TITLE = 'League Overlay'
  static readonly BASE_WIDTH = 1500
  static readonly BASE_HEIGHT = 860

  static readonly _overlay: Overlay = new Overlay;
  private readonly _timer: NodeJS.Timeout;
  private _visible: boolean = false

  constructor(_context: WindowManagerMainContext) {
    const state = new OverlayWindowState()
    const settings = new OverlayWindowSettings()

    super(_context, AkariOverlayWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariOverlayWindow.BASE_WIDTH,
      baseHeight: AkariOverlayWindow.BASE_HEIGHT,
      minWidth: AkariOverlayWindow.BASE_WIDTH,
      minHeight: AkariOverlayWindow.BASE_HEIGHT,
      htmlEntry: { path: AkariOverlayWindow.HTML_ENTRY, hash: AkariOverlayWindow.HTML_ENTRY_HASH } ,
      rememberPosition: false,
      settingSchema: {},
      browserWindowOptions: {
        title: AkariOverlayWindow.TITLE,
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
        backgroundColor: '#00000000',
      }
    })
    this._timer = setInterval(()=>{
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
      this._visible ? this._hide(): this._show()
    }
  }

  _setTop() {
    if (this.window && !AkariOverlayWindow._overlay.enable(this.window.getNativeWindowHandle()).res) {
      this.close()
      return
    }
  }

  _toggleClickThrough(value: boolean) {
    if (value) {
      this.window?.setIgnoreMouseEvents(true, { forward: true });
    } else {
      this.window?.setIgnoreMouseEvents(false);
    }
  }

  _show() {
    if (!this._visible) {
      this.window?.setBounds({width:AkariOverlayWindow.BASE_WIDTH ,height: AkariOverlayWindow.BASE_HEIGHT})
      this.window?.center()
      this.showOrRestore()
      this._toggleClickThrough(true)
      this._visible = true
    }
  }

  _hide() {
    if (this._visible) {
      // bug: https://github.com/electron/electron/issues/42772
      // 目前的解决方案是缩小到左上角进行隐藏, 需要时再转换回来
      this.window?.setBounds({x:0, y:0, width:0 ,height: 0})
      this.hide()
      this._visible = false
    }
  }
}
