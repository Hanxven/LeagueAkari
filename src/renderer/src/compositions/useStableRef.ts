import deepEqual from 'deep-eql'
import { customRef } from 'vue'

export function useStableRef<T = any>(initialValue: T) {
  return customRef<T>((track, trigger) => {
    let value = initialValue

    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        if (!deepEqual(newValue, value)) {
          value = newValue
          trigger()
        }
      }
    }
  })
}

