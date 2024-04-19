import { BrowserWindow, shell } from 'electron'
import { join } from 'path'

import icon from '../../../resources/LA_ICON.ico?asset'

let auxiliaryWindow: BrowserWindow | null = null

export function getChampSelectWindow() {
  return auxiliaryWindow
}

export function createAuxiliaryWindow(): void {
  auxiliaryWindow = new BrowserWindow({
    width: 460,
    height: 768,
    minWidth: 340,
    minHeight: 600,
    frame: false,
    show: false,
    title: 'Akaza Akari', // 这个窗口有一点阿卡林特性
    autoHideMenuBar: false,
    icon,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: false,

      backgroundThrottling: false
    }
  })

  auxiliaryWindow.on('ready-to-show', () => {
    if (auxiliaryWindow) {
      auxiliaryWindow.show()
    }
  })

  auxiliaryWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // initMainWindow(mainWindow)

  // // HMR
  // if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
  //   mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  // } else {
  //   mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  // }
}
