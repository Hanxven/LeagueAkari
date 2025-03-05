import { tryOnScopeDispose, useEventListener } from '@vueuse/core'
import { MaybeRefOrGetter, ref } from 'vue'

export function useRightClick(
  el: MaybeRefOrGetter<HTMLElement | null | undefined>,
  callback: Function,
  delay = 400
) {
  const clickCount = ref(0)
  let clickTimer: number | null = null

  useEventListener(el, 'contextmenu', (event) => {
    event.preventDefault()
    clickCount.value++

    if (!clickTimer) {
      clickTimer = window.setTimeout(() => {
        if (clickCount.value === 2) {
          callback?.()
        }
        resetClickCount()
      }, delay)
    }
  })

  const resetClickCount = () => {
    clickCount.value = 0
    clearTimeout(clickTimer!)
    clickTimer = null
  }

  tryOnScopeDispose(() => {
    clearTimeout(clickTimer!)
  })
}
