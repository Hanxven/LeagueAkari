import { lcuEventBus, setWebSocketSubscribeAll } from '@main/modules/akari-core/lcu-connection'
import { createLogger } from '@main/modules/akari-core/log'
import { getMainWindow } from '@main/modules/akari-core/main-window'
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
    try {
      if (enabled) {
        logger.info('发送所有 LCU 事件到 Main Window')
        setWebSocketSubscribeAll(true)
      } else {
        logger.info('取消发送所有 LCU 事件到 Main Window')
        setWebSocketSubscribeAll(false)
      }

      debugState.settings.setSendAllNativeLcuEvents(enabled)
    } catch {}
  })

  lcuEventBus.on('/**', (data) => {
    if (debugState.settings.sendAllNativeLcuEvents) {
      const mw = getMainWindow()

      // send only to the main window (for only debugging)
      if (mw) {
        sendEventToRenderer(mw.webContents, 'debug/native-lcu-event', data)
      }
    }
  })

  logger.info('初始化完成')
}
