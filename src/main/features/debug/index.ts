import { lcuEventBus } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { getMainWindow } from '@main/core/main-window'
import { ipcStateSync, onRendererCall, sendEventToRenderer } from '@main/utils/ipc'

import { debugState } from './state'

const logger = createLogger('debug')

/**
 * 构建临时的调试功能
 */
export async function setupDebug() {
  stateSync()
  ipcCall()
}

function stateSync() {
  ipcStateSync('debug/send-all-native-lcu-events', () => debugState.settings.sendAllNativeLcuEvents)
}

function ipcCall() {
  onRendererCall('debug/settings/send-all-native-lcu-events/set', async (_, enabled) => {
    if (enabled) {
      logger.info('发送所有 LCU 事件到 Main Window')
    } else {
      logger.info('取消发送所有 LCU 事件到 Main Window')
    }

    debugState.settings.setSendAllNativeLcuEvents(enabled)
  })

  lcuEventBus.on('/**', (data) => {
    if (debugState.settings.sendAllNativeLcuEvents) {
      const mw = getMainWindow()

      // send only to the main window (for debugging)
      if (mw) {
        sendEventToRenderer(mw.webContents, 'debug/native-lcu-event', data)
      }
    }
  })

  logger.info('初始化完成')
}
