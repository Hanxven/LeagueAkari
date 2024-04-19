import { parentPort } from 'node:worker_threads'

import input from '../native/laInputWin32x64.node'

parentPort!.on(
  'message',
  (message: { type: 'key'; key: number; press: boolean } | { type: 'string'; data: string }) => {
    if (message.type === 'key') {
      input.sendKey(message.key, message.press)
    } else if (message.type === 'string') {
      input.sendKeysX(message.data)
    }
  }
)
