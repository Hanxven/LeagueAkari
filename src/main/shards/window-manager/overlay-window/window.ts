import { Event } from 'electron'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { OverlayWindowSettings, OverlayWindowState } from './state'
import { GameClientMain } from '@main/shards/game-client'
import { Overlay } from '@leaguetavern/electron-overlay-win'

export class AkariOverlayWindow extends BaseAkariWindow<OverlayWindowState, OverlayWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'overlay-window'
  static readonly HTML_ENTRY = ''
  static readonly TITLE = 'League Overlay'
  static readonly BASE_WIDTH = 1500
  static readonly BASE_HEIGHT = 860
  static readonly MIN_WIDTH = 840
  static readonly MIN_HEIGHT = 600

  static readonly _overlay: Overlay = new Overlay;
  private readonly _timer: NodeJS.Timeout;
  private visible: boolean = false

  constructor(_context: WindowManagerMainContext) {
    const state = new OverlayWindowState()
    const settings = new OverlayWindowSettings()

    super(_context, AkariOverlayWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariOverlayWindow.BASE_WIDTH,
      baseHeight: AkariOverlayWindow.BASE_HEIGHT,
      minWidth: AkariOverlayWindow.MIN_WIDTH,
      minHeight: AkariOverlayWindow.MIN_HEIGHT,
      htmlEntry: AkariOverlayWindow.HTML_ENTRY,
      rememberPosition: false,
      rememberSize: true,
      settingSchema: {},
      browserWindowOptions: {
        title: AkariOverlayWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        focusable: false,
        maximizable: true,
        minimizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
      }
    })
    

    this._timer = setInterval(()=>{
      if (!GameClientMain.isGameClientForeground() && this.visible) {
        this.hide()
      }
    }, 200)
  }

  private _handleMainWindowLogics() {
    this._mobx.reaction(
      () => this.state.ready,
      (ready) => {
        if (!ready) {
          return 
        }
        if (!AkariOverlayWindow._overlay.enable(this.window.getNativeWindowHandle()).res) {
          this.close();
        }
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

    this._handleMainWindowLogics()
  }

  public toggleVisible() {
    (GameClientMain.isGameClientForeground() && this.visible) ? this._hide(): this._show()
  }

  _show() {
    if (!this.visible) {
      this.showOrRestore()
      this.visible = true
    }
  }

  _hide() {
    if (this.visible) {
      this.hide()
      this.visible = false
    }
  }
}
