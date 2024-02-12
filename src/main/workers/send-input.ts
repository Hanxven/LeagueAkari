// 假设有一个模块提供sendKeysX方法，你需要根据实际情况调整导入路径和方法
import { parentPort } from 'worker_threads'

import input from '../native/ltInputWin32x64.node'

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
