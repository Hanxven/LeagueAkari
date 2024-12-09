import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow } from 'electron'

import { Overlay } from "@leaguetavern/electron-overlay-win";

import icon from '../../../../resources/LA_ICON.ico?asset'

export class OverlayWindowMain {
  private _window: BrowserWindow | null = null
  private _inst: Overlay = new Overlay()

  create() {
    this._window = new BrowserWindow({
      fullscreen: false,
      resizable: false,
      frame: false,
      title: 'Akari Overlay',
      autoHideMenuBar: true,
      maximizable: false,
      minimizable: false,
      icon,
      skipTaskbar: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false,
        partition: 'persist:overlay-window'
      }
    })

    // this._ow.setIgnoreMouseEvents(true, { forward: true });
    // this._ow.setSkipTaskbar(true);
    this._window.removeMenu();
    this._window.restore();
    this._window.show();
    this._window?.webContents.toggleDevTools()

    // this._ow.webContents.on('before-input-event', (event, input) => {
    //   event.preventDefault()
    // })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay-window.html`)
    } else {
      this._window.loadFile(join(__dirname, '../renderer/overlay-window.html'))
    }

    this._inst.enable(this._window.getNativeWindowHandle())
  }

  destroy() {
    this._window?.destroy()
  }

  show() {
    this._window?.show()
  }

  hide() {
    this._window?.hide();
  }

  close() {
    this._window?.close()
  }

  setClickThrough(value: boolean) {
    if (value) {
      this._window?.setIgnoreMouseEvents(true, { forward: true });
    } else {
      this._window?.setIgnoreMouseEvents(false);
    }
  }

}