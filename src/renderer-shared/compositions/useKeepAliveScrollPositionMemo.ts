import { useScroll } from '@vueuse/core'
import { MaybeRefOrGetter, onActivated, onDeactivated } from 'vue'

/**
 * 用于在 KeelAlive 下，自动恢复之前的滚动位置
 * @param el
 */
export function useKeepAliveScrollPositionMemo(el: MaybeRefOrGetter) {
  let lastTop = 0
  let lastLeft = 0

  const { x, y } = useScroll(el)

  onActivated(() => {
    x.value = lastLeft
    y.value = lastTop
  })

  onDeactivated(() => {
    lastLeft = x.value
    lastTop = y.value
  })
}
