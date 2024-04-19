import { onRendererCall, sendEventToAllRenderer, sendEventToRenderer } from '@main/utils/ipc'
import { Notification, app } from 'electron'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import { randomUUID } from 'node:crypto'
import EventEmitter from 'node:events'
import { Worker } from 'node:worker_threads'

import sendInputWorker from '../workers/send-input?nodeWorker'
import { createLogger } from './log'

const gkl = new GlobalKeyboardListener()

const logger = createLogger('windows-platform')

let siw: Worker | null = null

export const winPlatformEventBus = new EventEmitter()

// 和平台相关的 API，目前仅限 Windows
export function initWindowsPlatform() {
  // 系统级别的通知事件，暂未实装
  onRendererCall('windows/notify', (event, options) => {
    options.id = options.id || randomUUID()

    const notification = new Notification({ ...options })

    notification.on('click', () => {
      winPlatformEventBus.emit('notification/click', options.id)
      sendEventToRenderer(event.sender, 'notification/click', options.id)
    })

    notification.on('close', () => {
      winPlatformEventBus.emit('notification/close', options.id)
      sendEventToRenderer(event.sender, 'notification/close', options.id)
    })

    notification.show()
  })

  siw = sendInputWorker({})

  onRendererCall('windows/send-key', (_, key, pressed) => {
    siw?.postMessage({ type: 'key', key, press: pressed })
  })

  onRendererCall('windows/send-keys', (_, str) => {
    siw?.postMessage({ type: 'string', data: str })
  })

  let pageUpShortcut = false
  let pageDownShortcut = false
  gkl.addListener((event) => {
    if (event.state === 'DOWN') {
      if (event.name === 'PAGE UP') {
        pageUpShortcut = true
      } else if (event.name === 'PAGE DOWN') {
        pageDownShortcut = true
      }
    }

    if (event.state === 'UP') {
      if (event.name === 'PAGE UP' && pageUpShortcut) {
        pageUpShortcut = false
        winPlatformEventBus.emit('windows/global-key/page-up')
        sendEventToAllRenderer('windows/global-key/page-up')
      } else if (event.name === 'PAGE DOWN' && pageDownShortcut) {
        pageDownShortcut = false
        winPlatformEventBus.emit('windows/global-key/page-down')
        sendEventToAllRenderer('windows/global-key/page-down')
      }
    }
  })

  app.on('before-quit', () => {
    siw?.terminate()
    gkl.kill()
  })

  logger.info('Initialized')
}

export function pSendKey(key: number, pressed: boolean) {
  if (siw) {
    siw.postMessage({ type: 'key', key, press: pressed })
  }
}

export function pSendKeys(str: string) {
  if (siw) {
    siw.postMessage({ type: 'string', data: str })
  }
}
