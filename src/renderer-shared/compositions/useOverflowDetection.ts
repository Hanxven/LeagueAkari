import { useResizeObserver } from '@vueuse/core'
import { MaybeRefOrGetter, computed, readonly, ref, toRef, toValue, watchEffect } from 'vue'

function getRect(element: HTMLElement) {
  return element.getBoundingClientRect()
}

/**
 * 元素是否存在 overflow
 * @param el 元素
 * @param co 容器
 * @returns
 */
export function useOverflowDetection<T extends HTMLElement | undefined | null>(
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

  const update = (
    element: HTMLElement | undefined | null,
    container: HTMLElement | undefined | null
  ) => {
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
export function useCompleteVisibility<T extends HTMLElement | undefined | null>(
  el: MaybeRefOrGetter<T>,
  co: MaybeRefOrGetter<T>
) {
  const { collidedBottom, collidedLeft, collidedRight, collidedTop } = useOverflowDetection(el, co)

  return computed(
    () => !collidedBottom.value && !collidedLeft.value && !collidedRight.value && !collidedTop.value
  )
}

/**
 * 判断元素是否已经超出范围，使用 overflow: hidden 时若挡住元素则返回 true
 * @param el
 */
export function useOverflow<T extends HTMLElement | null | undefined>(el: MaybeRefOrGetter<T>) {
  const vertical = ref(false)
  const horizontal = ref(false)

  useResizeObserver(el, () => {
    const _el = toValue(el)
    if (!_el) {
      vertical.value = false
      horizontal.value = false
      return
    }

    const style = window.getComputedStyle(_el)

    const overflowYHidden = style.overflowY === 'hidden' || style.overflow === 'hidden'
    const overflowXHidden = style.overflowX === 'hidden' || style.overflow === 'hidden'

    const verticalOverflow = overflowYHidden && _el.scrollHeight > _el.clientHeight
    const horizontalOverflow = overflowXHidden && _el.scrollWidth > _el.clientWidth

    vertical.value = verticalOverflow
    horizontal.value = horizontalOverflow
  })

  return {
    vertical: readonly(vertical),
    horizontal: readonly(horizontal)
  }
}
