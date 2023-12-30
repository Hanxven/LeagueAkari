import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, shell } from 'electron'
import { join } from 'path'
import 'reflect-metadata'

import icon from '../../resources/icon.png?asset'
import { initBasicIpc } from './core/basic'
import { initConnectionIpc } from './core/connection'
import { initLcuClientFunctions } from './core/lcu-client'
import { initWindowsPlatform } from './core/platform'
import { initWindowIpc } from './core/window'
import { initDatabase } from './db'
import { initStorageQuery } from './storage'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

let mainWindow: BrowserWindow

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 768,
    minWidth: 670,
    minHeight: 520,
    frame: false,
    show: false,
    title: 'League Toolkit',
    autoHideMenuBar: false,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  initWindowIpc(mainWindow)

  // HMR
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('sugar.cocoa.league-toolkit')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initBasicIpc()
  initConnectionIpc()
  initWindowsPlatform()
  initDatabase()
  initStorageQuery()
  initLcuClientFunctions()

  createMainWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
