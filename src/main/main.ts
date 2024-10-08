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
import { appModule } from './modules/app'
import { logModule } from './modules/log'
import { mainWindowModule } from './modules/main-window'

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

appModule.registerAkariProtocolAsPrivileged()

const baseConfig = appModule.readBaseConfig()
if (
  baseConfig &&
  baseConfig.disableHardwareAcceleration &&
  baseConfig.disableHardwareAcceleration === true
) {
  logger.info('禁用硬件加速')
  app.disableHardwareAcceleration()
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId(AKARI_USER_MODEL_ID)
  appModule.state.setReady(true)

  try {
    logger.info(`League Akari ${app.getVersion()}`)
    await setupLeagueAkariModules()
    mainWindowModule.createWindow()
  } catch (e) {
    logger.error(`初始化时出现错误 ${formatError(e)}`)
    dialog.showErrorBox('在初始化时出现错误', e && (e as any).message)
    app.quit()
  }
})

process.on('uncaughtException', (e) => {
  if (!appModule.state.isQuitting) {
    logger.error(`uncaughtException ${formatError(e)}`)
  }

  dialog.showErrorBox('未捕获的异常', e.message)
  console.error(e)
  app.quit()
})

process.on('unhandledRejection', (e) => {
  if (!appModule.state.isQuitting) {
    logger.error(`unhandledRejection ${formatError(e)}`)
  }

  console.error(e)
})
