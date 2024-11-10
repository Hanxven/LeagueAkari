import { RadixEventEmitter } from '@shared/event-emitter'
import { getCurrentScope, onScopeDispose } from 'vue'

export function createEventBus() {
  const matcher = new RadixEventEmitter()

  const on = <T = any, P = Record<string, any>>(
    uri: string,
    listener: (data: T, params: P) => void
  ) => {
    const off = matcher.on(uri, listener)

    const scope = getCurrentScope()
    if (scope) {
      onScopeDispose(() => off())
    }

    return off
  }

  return {
    on,
    emit: matcher.emit.bind(matcher)
  }
}
