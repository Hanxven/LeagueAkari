import { lcuEventEmitter } from '@main/core/lcu-connection'
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
      logger.info('Now all lcu events will be sent to the main window')
    } else {
      logger.info('Lcu events sending is canceled')
    }

    debugState.settings.setSendAllNativeLcuEvents(enabled)
  })

  lcuEventEmitter.on('/**', (data) => {
    if (debugState.settings.sendAllNativeLcuEvents) {
      const mw = getMainWindow()

      // send only to the main window (for debugging)
      if (mw) {
        sendEventToRenderer(mw.webContents, 'debug/native-lcu-event', data)
      }
    }
  })

  logger.info('Initialized')
}
