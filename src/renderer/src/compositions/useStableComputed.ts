import deepEqual from 'deep-eql'
import { ComputedRef, shallowRef } from 'vue'
import { computed } from 'vue'

/**
 * 在真正发生变化时触发变更时进行深度比较，当存在不同时触发更新
 * @param getter Getter
 */
export function useStableComputed<T = any>(getter: () => T): ComputedRef<T> {
  const previousValue = shallowRef<T>(getter())

  const computedValue = computed(() => {
    const currentValue = getter()
    if (!deepEqual(currentValue, previousValue.value)) {
      previousValue.value = currentValue
      return currentValue
    }

    return previousValue.value
  })

  return computedValue
}
