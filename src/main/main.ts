import 'reflect-metadata'

import { electronApp } from '@electron-toolkit/utils'
import { AKARI_USER_MODEL_ID } from '@shared/constants/common'
import { formatError } from '@shared/utils/errors'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { app, dialog } from 'electron'
import { configure } from 'mobx'
import EventEmitter from 'node:events'

import { setupLeagueAkariModules } from './modules'
import { appModule } from './modules/akari-core/app-new'
import { logModule } from './modules/akari-core/log-new'
import { mainWindowModule } from './modules/akari-core/main-window-new'

dayjs.extend(relativeTime)
dayjs.extend(duration)

EventEmitter.defaultMaxListeners = 1000

configure({ enforceActions: 'observed' })

const logger = logModule.createLogger('init')

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  logger.info(`League Akari 已启动，将退出当前实例`)
  app.quit()
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId(AKARI_USER_MODEL_ID)
  appModule.state.setReady(true)

  try {
    await setupLeagueAkariModules()
    mainWindowModule.createWindow()
  } catch (e) {
    logger.error(`初始化时出现错误 ${formatError(e)}`)
    dialog.showErrorBox('在初始化时出现错误', e && (e as any).message)
    app.quit()
  }
})

process.on('uncaughtException', (e) => {
  logger.error(`uncaughtException ${formatError(e)}`)
  dialog.showErrorBox('未捕获的异常', e.message)
  app.quit()
})

process.on('unhandledRejection', (e) => {
  logger.error(`unhandledRejection ${formatError(e)}`)
  console.error(e)
})
