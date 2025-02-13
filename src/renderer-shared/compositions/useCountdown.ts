import { MaybeRefOrGetter, toRef, useIntervalFn } from '@vueuse/core'
import { ref, watch } from 'vue'

const INTERVAL_CONSTANT = 92

export function useCountdownSeconds(
  start: MaybeRefOrGetter<boolean>,
  deadline: MaybeRefOrGetter<number>
) {
  const _countdownTime = ref(0)
  const _deadline = toRef(deadline)
  const _start = toRef(start)

  const { pause, resume } = useIntervalFn(
    () => {
      const s = (_deadline.value - Date.now()) / 1e3
      _countdownTime.value = Math.abs(Math.max(s, 0))
    },
    INTERVAL_CONSTANT,
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
