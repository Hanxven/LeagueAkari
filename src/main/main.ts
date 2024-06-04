import 'reflect-metadata'

import { electronApp, optimizer } from '@electron-toolkit/utils'
import { formatError } from '@shared/utils/errors'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { BrowserWindow, app, dialog } from 'electron'
import { configure } from 'mobx'
import EventEmitter from 'node:events'

import { appState, initApp } from './core-modules/app'
import { initAuxiliaryWindow } from './core-modules/auxiliary-window'
import { initLeagueClientFunctions } from './core-modules/lcu-client'
import { initLcuConnection } from './core-modules/lcu-connection'
import { createLogger, initLogger } from './core-modules/log'
import { createMainWindow, initMainWindow, restoreAndFocus } from './core-modules/main-window'
import { initWindowsPlatform } from './core-modules/platform'
import { initDatabase } from './db'
import { setupLeagueAkariFeatures, setupLeagueAkariModules } from './modules'
import { initStorageIpc } from './storage'
import { sendEventToAllRenderers } from './utils/ipc'

dayjs.extend(relativeTime)
dayjs.extend(duration)

EventEmitter.defaultMaxListeners = 1000

configure({ enforceActions: 'observed' })

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

const logger = createLogger('league-akari')

app.whenReady().then(async () => {
  appState.setReady(true)

  electronApp.setAppUserModelId('sugar.cocoa.league-akari')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    initLogger()
    await initDatabase()
    await initApp()
    initWindowsPlatform()
    await initLcuConnection()
    initStorageIpc()
    await initLeagueClientFunctions()
    await setupLeagueAkariFeatures()
    await setupLeagueAkariModules()
    await initAuxiliaryWindow()
    initMainWindow()

    logger.info('League Akari 核心模块初始化完成')

    createMainWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })

    app.on('second-instance', (_event, commandLine, workingDirectory) => {
      logger.info(`用户尝试启动第二个实例, cmd=${commandLine}, pwd=${workingDirectory}`)

      restoreAndFocus()

      sendEventToAllRenderers('app/second-instance', commandLine, workingDirectory)
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
  console.error(e)
  logger.error(`uncaughtException: ${formatError(e)}`)
  dialog.showErrorBox('未捕获的异常', e.message)
  app.quit()
})

process.on('unhandledRejection', (e) => {
  console.error(e)
  logger.error(`unhandledRejection: ${formatError(e)}`)
})
