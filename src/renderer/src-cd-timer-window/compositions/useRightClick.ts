import { tryOnScopeDispose, useEventListener } from '@vueuse/core'
import { MaybeRefOrGetter, ref } from 'vue'

export function useRightClick(
  el: MaybeRefOrGetter<HTMLElement | null | undefined>,
  callback: Function,
  clicksRequired = 2,
  delay = 400
) {
  const clickCount = ref(0)
  let clickTimer: number | null = null

  useEventListener(el, 'contextmenu', (event) => {
    event.preventDefault()
    clickCount.value++

    if (clickCount.value === clicksRequired) {
      callback?.()
      resetClickCount()
      return
    }

    if (clickTimer) clearTimeout(clickTimer)

    clickTimer = window.setTimeout(() => {
      resetClickCount()
    }, delay)
  })

  const resetClickCount = () => {
    clickCount.value = 0
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
  }

  tryOnScopeDispose(() => {
    if (clickTimer) clearTimeout(clickTimer)
  })
}
