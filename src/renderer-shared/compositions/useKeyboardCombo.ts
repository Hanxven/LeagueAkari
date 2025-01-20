import { type Fn, type MaybeRefOrGetter, noop, tryOnScopeDispose } from '@vueuse/core'
import { useEventListener } from '@vueuse/core'

const DEFAULT_TIMEOUT = 500

type SeqKeyType = string | KeyType[]

type KeyType = string | string[] | ((key: string) => boolean)

export interface ComboOptions<T extends SeqKeyType> {
  /** 绑定在哪个元素上，默认 body */
  el?: MaybeRefOrGetter<HTMLElement>

  /** 必须是绑定元素本身的，比如，绑定在父元素上却在该元素内部的 input 里面输入，就不生效 */
  requireSameEl?: boolean

  /** 是否立即 start，否则就要手动调用 start */
  immediate?: boolean

  /** 最大间隔，0 或 负数时代表不限时 */
  timeout?: number

  /** 是否大小写敏感 */
  caseSensitive?: boolean

  /**
   * 匹配 code 而不是 key。（注意区分 keyCode 和 code，前者已经 deprecated）
   * code 可以提供更加详细的按键信息，比如区分是左 Ctrl 还是 右 Ctrl
   */
  matchCode?: boolean

  /** 当成功打出所有序列后 */
  onFinish?: (key: string, pos: number, comboSeq: T, ev: KeyboardEvent) => any

  /** 每当匹配上一个的时候都会触发 */
  onMatch?: (key: string, pos: number, comboSeq: T, ev: KeyboardEvent) => any

  /** 当不匹配的时候，位置为最后一次匹配成功的位置 */
  onMismatch?: (key: string, pos: number, comboSeq: T, ev: KeyboardEvent) => any

  /** 连招超时的回调 */
  onTimeout?: (key: string, pos: number, comboSeq: T) => any
}

export interface ComboReturn {
  stop: () => void
  start: () => void
  isStarted: () => boolean
}

function isKeyEquals(key: string, targetKey: KeyType, caseSensitive: boolean): boolean {
  if (key === undefined) {
    return false
  }
  if (typeof targetKey === 'function') {
    return targetKey(key)
  }
  if (Array.isArray(targetKey)) {
    if (caseSensitive) {
      return targetKey.includes(key)
    }
    return (
      targetKey.findIndex((v) => {
        if (v.length === 1) {
          return key.toLowerCase() === v.toLowerCase()
        }
        return key === v
      }) !== -1
    )
  } else {
    if (caseSensitive || targetKey.length !== 1) {
      return key === targetKey
    }
    return key.toLowerCase() === targetKey.toLowerCase()
  }
}

/**
 * 打出连招即可触发！
 * @param comboSeq 需要打出的连招序列，值等于 KeyboardEvent 的 key。
 * ```ts
 * const seq = 'abcd' // 打出 abcd 的序列即可触发
 * const seq2 = ['a', 'b', 'Enter'] // 打出 ab 回车 即可触发
 * const seq3 = [['a', 'Control'], 'b'] // 第一个键可以是 a 或 Ctrl（不分左右 Ctrl）
 * const seq4 = [key => { return ['f', 'u', 'c', 'k'].includes(key) }] // 你甚至可以给一个判断函数
 * ```
 * @param options 配置
 * @return {ComboReturn} 配置项
 */
export function useKeyboardCombo<T extends SeqKeyType>(
  comboSeq: T,
  options: ComboOptions<T> = {}
): ComboReturn {
  const {
    el,
    requireSameEl = false,
    immediate = true,
    timeout = DEFAULT_TIMEOUT,
    caseSensitive = false,
    matchCode = false,
    onMatch,
    onMismatch,
    onFinish,
    onTimeout
  } = options

  const bindEl = el ? el : window.document.body

  let timerId = 0
  let currentPos = 0
  let started = immediate

  const _handleKeyMatch = (key: string, ev: KeyboardEvent) => {
    currentPos++
    onMatch?.(key, currentPos, comboSeq, ev)
    if (currentPos >= comboSeq.length) {
      currentPos = 0
      if (timeout > 0) {
        window.clearTimeout(timerId)
      }
      onFinish?.(key, comboSeq.length - 1, comboSeq, ev)
    } else {
      if (timeout > 0) {
        window.clearTimeout(timerId)
        timerId = window.setTimeout(() => {
          const prevPos = currentPos
          currentPos = 0
          onTimeout?.(key, prevPos, comboSeq)
        }, timeout)
      }
    }
  }

  const _handleKeyboardEvent = (ev: KeyboardEvent) => {
    let key: string
    if (matchCode) {
      key = ev.code
    } else {
      key = ev.key
    }
    if (requireSameEl && ev.target !== ev.currentTarget) {
      return
    }
    if (isKeyEquals(key, comboSeq[currentPos], caseSensitive)) {
      _handleKeyMatch(key, ev)
    } else {
      const prevPos = currentPos
      currentPos = 0
      onMismatch?.(key, prevPos, comboSeq, ev)
      // 这里判断是否被调整过了，因为 currentPos 现在应该是 0
      if (currentPos === 0) {
        if (timeout > 0) {
          window.clearTimeout(timerId)
        }
        if (isKeyEquals(key, comboSeq[currentPos], caseSensitive)) {
          _handleKeyMatch(key, ev)
        }
      }
    }
  }

  let off: Fn = noop

  if (started) {
    off = useEventListener(bindEl, 'keydown', _handleKeyboardEvent)
  }

  const stopFn = () => {
    if (started) {
      started = false
      if (timeout > 0) {
        window.clearTimeout(timerId)
      }
      off()
    }
  }

  const startFn = () => {
    if (!started) {
      off = useEventListener(bindEl, 'keydown', _handleKeyboardEvent)
      started = true
    }
  }

  tryOnScopeDispose(stopFn)

  return { stop: stopFn, start: startFn, isStarted: () => started }
}
