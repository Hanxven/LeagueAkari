import { customRef } from 'vue'
import _ from 'lodash'

export function useStableRef<T = any>(initialValue: T) {
  return customRef<T>((track, trigger) => {
    let value = initialValue

    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        if (!_.isEqual(newValue, value)) {
          value = newValue
          trigger()
        }
      }
    }
  })
}
