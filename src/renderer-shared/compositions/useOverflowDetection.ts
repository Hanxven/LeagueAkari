import { useResizeObserver } from '@vueuse/core'
import { MaybeRefOrGetter, computed, readonly, ref, toRef } from 'vue'

function getRect(element: HTMLElement) {
  return element.getBoundingClientRect()
}

/**
 * 元素是否存在 overflow
 * @param el 元素
 * @param co 容器
 * @returns
 */
export function useOverflowDetection<T extends HTMLElement | undefined>(
  el: MaybeRefOrGetter<T>,
  co: MaybeRefOrGetter<T>
) {
  const collidedTop = ref(false)
  const collidedBottom = ref(false)
  const collidedLeft = ref(false)
  const collidedRight = ref(false)
  const overflowTop = ref(0)
  const overflowBottom = ref(0)
  const overflowRight = ref(0)
  const overflowLeft = ref(0)

  const update = (element: HTMLElement | undefined, container: HTMLElement | undefined) => {
    if (!element || !container) {
      return
    }

    collidedTop.value = getRect(element).top < getRect(container).top
    collidedBottom.value = getRect(element).bottom > getRect(container).bottom
    collidedLeft.value = getRect(element).left < getRect(container).left
    collidedRight.value = getRect(element).right > getRect(container).right
    overflowTop.value = getRect(container).top - getRect(element).top
    overflowBottom.value = getRect(element).bottom - getRect(container).bottom
    overflowRight.value = getRect(container).left - getRect(element).left
    overflowLeft.value = getRect(element).right - getRect(container).right
  }

  const elRef = toRef(el)
  const coRef = toRef(co)

  update(elRef.value, coRef.value)

  useResizeObserver(el, () => update(elRef.value, coRef.value))
  useResizeObserver(co, () => update(elRef.value, coRef.value))

  return {
    collidedTop: readonly(collidedTop),
    collidedBottom: readonly(collidedBottom),
    collidedLeft: readonly(collidedLeft),
    collidedRight: readonly(collidedRight),
    overflowTop: readonly(overflowTop),
    overflowBottom: readonly(overflowBottom),
    overflowRight: readonly(overflowRight),
    overflowLeft: readonly(overflowLeft)
  }
}

/**
 * 元素是否完全可见
 * @param el 元素
 * @param co 容器
 * @returns
 */
export function useCompleteVisibility<T extends HTMLElement | undefined>(
  el: MaybeRefOrGetter<T>,
  co: MaybeRefOrGetter<T>
) {
  const { collidedBottom, collidedLeft, collidedRight, collidedTop } = useOverflowDetection(el, co)

  return computed(
    () => !collidedBottom.value && !collidedLeft.value && !collidedRight.value && !collidedTop.value
  )
}
