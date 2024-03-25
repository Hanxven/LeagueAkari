import { randomUUID } from 'crypto'
import { Notification, app } from 'electron'
import { GlobalKeyboardListener } from 'node-global-key-listener'

import { onCall, sendUpdate, sendUpdateToAll } from '../utils/ipc'
import sendInputWorker from '../workers/send-input?nodeWorker'

const gkl = new GlobalKeyboardListener()

// 和平台相关的 API，目前仅限 Windows
export function initWindowsPlatform() {
  // 系统级别的通知事件，暂未实装
  onCall('notification', (event, options) => {
    options.id = options.id || randomUUID()

    const n = new Notification({
      ...options
    })

    n.on('click', () => {
      sendUpdate(event.sender, 'notification:click', options.id)
    })

    n.on('close', () => {
      sendUpdate(event.sender, 'notification:close', options.id)
    })

    n.show()
  })

  const siw = sendInputWorker({})

  onCall('sendKey', (_, key, pressed) => {
    siw.postMessage({ type: 'key', key, press: pressed })
  })

  onCall('sendKeys', (_, str) => {
    siw.postMessage({ type: 'string', data: str })
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
        sendUpdateToAll('globalKey:PageUp')
        pageUpShortcut = false
      } else if (event.name === 'PAGE DOWN' && pageDownShortcut) {
        sendUpdateToAll('globalKey:PageDown')
        pageDownShortcut = false
      }
    }
  })

  app.on('before-quit', () => {
    gkl.kill()
  })
}
