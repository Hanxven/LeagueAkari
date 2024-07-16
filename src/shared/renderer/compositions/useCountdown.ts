import { MaybeRefOrGetter, toRef, useIntervalFn } from '@vueuse/core'
import { ref, watch } from 'vue'

export function useCountdown(start: MaybeRefOrGetter<boolean>, deadline: MaybeRefOrGetter<number>) {
  const _countdownTime = ref(0)
  const _deadline = toRef(deadline)
  const _start = toRef(start)

  const { pause, resume } = useIntervalFn(
    () => {
      const s = (_deadline.value - Date.now()) / 1e3
      _countdownTime.value = Math.abs(Math.max(s, 0))
    },
    92,
    { immediate: false, immediateCallback: true }
  )

  watch(
    _start,
    (ok) => {
      if (ok) {
        resume()
      } else {
        pause()
      }
    },
    { immediate: true }
  )

  return { countdownTime: _countdownTime }
}
