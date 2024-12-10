import { is } from '@electron-toolkit/utils'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { Overlay } from '@leaguetavern/electron-overlay-win'
import { SHARED_GLOBAL_ID } from '@shared/akari-shard/manager'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { AkariIpcMain } from '../ipc'
import { AkariLogger } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { GameClientMain } from '../game-client'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'


export class OverlayMain implements IAkariShardInitDispose {
  static id = 'overlay-main'
  static dependencies = [
    SHARED_GLOBAL_ID,
    'akari-ipc-main',
    'mobx-utils-main',
    'logger-factory-main',
    'keyboard-shortcuts-main'
  ]

  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain
  private readonly _log: AkariLogger
  private _kbd: KeyboardShortcutsMain

  private _window: BrowserWindow | null = null
  private _inst: Overlay = new Overlay()
  private visible: boolean = false

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._log = deps['logger-factory-main'].create(OverlayMain.id)
    this._kbd = deps['keyboard-shortcuts-main']
  }

  async onInit() {
    this._create()
    this._initShortCuts()
    this._handleIpcCall()
  }

  private _handleIpcCall() {
    this._ipc.onCall(OverlayMain.id, 'overlay/show', () => {
      this.show();
    })
    this._ipc.onCall(OverlayMain.id, 'overlay/clickThrough', (value: boolean) => {
      this._toggleClickThrough(value);
    })
  }

  private _create() {
    this._window = new BrowserWindow({
      fullscreen: true,
      resizable: false,
      frame: false,
      title: 'Akari Overlay',
      autoHideMenuBar: true,
      maximizable: false,
      minimizable: false,
      show: false,
      icon,
      skipTaskbar: false,
      transparent: true,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false,
        partition: 'persist:overlay-window'
      }
    })

    // this._window.setIgnoreMouseEvents(true, { forward: true });
    // this._window.setSkipTaskbar(true);
    this._window.removeMenu();
    this.toggleDevTools()

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay-window.html`)
    } else {
      this._window.loadFile(join(__dirname, '../renderer/overlay-window.html'))
    }
    try {
      this._inst.enable(this._window.getNativeWindowHandle())
    } catch(err) {
      this._log.error(err)
    }
  }
  
  private _initShortCuts() {
    // if (!GameClientMain.isGameClientForeground()) {
    // }
    this._kbd.register(`${OverlayMain.id}/visible`, 'LeftControl+X', 'normal', () => {
      if (this._window) {
        this.visible ? this.hide() : this.show()
      }
    })
  }

  private _toggleClickThrough(value: boolean) {
    if (value) {
      this._window?.setIgnoreMouseEvents(true, { forward: true });
    } else {
      this._window?.setIgnoreMouseEvents(false);
    }
  }

  create() {
    if (!this._window || this._window.isDestroyed()) {
      this._create()
    }
  }

  close() {
    this._window?.close()
  }

  show() {
    if (this._window && !this.visible) {
      this._window?.show()
      this.visible = true
    }
  }

  hide() {
    if (this._window  && this.visible) {
      this._window?.hide()
      this.visible = false
    }
  }

  toggleDevTools() {
    this._window?.webContents.toggleDevTools()
  }

}
