import 'reflect-metadata'

import { electronApp, optimizer } from '@electron-toolkit/utils'
import { formatError } from '@shared/utils/errors'
import { BrowserWindow, app, dialog } from 'electron'
import { configure } from 'mobx'

import { initApp } from './core/app'
import { initLeagueClientFunctions } from './core/lcu-client'
import { initLcuConnection } from './core/lcu-connection'
import { createLogger, initLogger } from './core/log'
import { createMainWindow, getMainWindow } from './core/main-window'
import { initWindowsPlatform } from './core/platform'
import { initDatabase } from './db'
import { setupLeagueAkariFeatures } from './features'
import { initStorageIpc } from './storage'
import { sendEventToAllRenderer } from './utils/ipc'
import { checkWmicAvailability } from './utils/shell'

configure({ enforceActions: 'observed' })

const gotTheLock = app.requestSingleInstanceLock()

const logger = createLogger('initialization')

if (!gotTheLock) {
  app.quit()
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('sugar.cocoa.league-akari')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    initLogger()
    initWindowsPlatform()
    await initDatabase()
    checkWmicAvailability()
    await initApp()
    await initLcuConnection()
    initStorageIpc()
    await initLeagueClientFunctions()
    await setupLeagueAkariFeatures()

    logger.info('LEAGUE AKARI - INITIALIZED')

    createMainWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })

    app.on('second-instance', (_event, commandLine, workingDirectory) => {
      logger.info(`Trying to launch a second instance, cmd=${commandLine}, pwd=${workingDirectory}`)

      const mainWindow = getMainWindow()
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.focus()
      } else {
        createMainWindow()
      }

      sendEventToAllRenderer('app/second-instance', commandLine, workingDirectory)
    })
  } catch (e) {
    logger.error(`Failed to initialize League Akari, due to ${formatError(e)}`)

    dialog.showErrorBox('在初始化时出现错误', e && (e as any).message)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (e) => {
  logger.error(`uncaughtException: ${formatError(e)}`)
  dialog.showErrorBox('未捕获的异常', e.message)
  app.quit()
})

process.on('unhandledRejection', (e) => {
  logger.error(`unhandledRejection: ${formatError(e)}`)
})
