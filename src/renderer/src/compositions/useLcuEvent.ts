import { getCurrentScope, onScopeDispose } from 'vue'

import { LcuEvent, onLcuEvent } from '@renderer/features/update/lcu-events'

/**
 * Vue 3 封装，在结束作用域自动清除监听，适合临时监听 LCU 事件
 * @param uri
 * @param listener
 * @returns
 */
export function useLcuEvent<T = any, P = Record<string, any>>(
  uri: string,
  listener: (event: LcuEvent<T>, params: P) => void
) {
  let stopped = false
  const stopHandle = onLcuEvent(uri, listener)

  const stop = () => {
    if (stopped) {
      return
    }
    stopHandle()
    stopped = true
  }

  if (getCurrentScope()) {
    onScopeDispose(stop)
  }

  return stop
}
