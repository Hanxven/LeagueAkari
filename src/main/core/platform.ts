import { randomUUID } from 'crypto'
import { Notification } from 'electron'

import { onCall, sendUpdate } from './common'

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

  // 下等马相关功能，暂停开发
  // import input from '../native/ltInputWin32x64.node'
  // onCall('sendKey', (_, key, pressed) => {
  //   input.sendKey(key, pressed)
  // })

  // onCall('sendKeys', (_, str) => {
  //   input.sendKeys(str)
  // })
}
