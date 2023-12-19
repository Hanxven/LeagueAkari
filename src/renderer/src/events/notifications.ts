import { useEventBus } from '@vueuse/core'
import dayjs from 'dayjs'
import { NotificationOptions, useNotification } from 'naive-ui'

// League Toolkit 的基础消息通知机制
export const notify = useEventBus<NotificationEvent>(Symbol('notifications'))

export interface NotificationEvent {
  type?: 'error' | 'info' | 'success' | 'warning'

  /**
   * 通知的 ID，用于区分通知
   * 
   * `core:` - 应用本身
   *
   * `store:` - 来自某个全局状态内置方法
   *
   * `feature:` - 来自某个功能模块
   *
   * `state-update` - 特指用于更新各种内部状态的 state update
   *
   * `view:` - 来自某个页面
   *
   * `other:` - 其他
   */
  id?: string

  // 通知的标题
  title?: string

  // 通知的内容
  content?: string

  // 用于 Naive UI 的通知选项
  naiveUiOptions?: NotificationOptions

  // 是否静默，静默的通知不会显示在 Naive UI 的通知栏中
  silent?: boolean

  // 额外的信息，用于调试
  extra?: {
    error?: any
  }
}

export function formatNotification(event: NotificationEvent) {
  return `[${dayjs().format('MM/DD HH:mm:ss')}] [${event.id ?? '(no id)'}] [${event.type}] ${
    event.title ?? '(no title)'
  }: ${event.content ?? '(no content)'}`
}

// for debugging
notify.on((event) => {
  if (event.extra) {
    console.log(formatNotification(event), event.extra)
  } else {
    console.log(formatNotification(event))
  }
})

let setup = false

// 用于 Naive UI 的通知事件展示
export function setupNaiveUiNotificationEvents() {
  if (setup) {
    return
  }

  setup = true

  const notification = useNotification()

  notify.on((event) => {
    if (event.silent === undefined || !event.silent) {
      notification.create({
        type: event.type ?? 'info',
        title: event.title,
        content: event.content,
        duration: 4000,
        ...event.naiveUiOptions
      })
    }

    if (event.extra && event.extra.error) {
      console.error(event.extra.error, event.extra.error?.response)
    }
  })
}
