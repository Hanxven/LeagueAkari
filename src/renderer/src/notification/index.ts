import { LEAGUE_AKARI_DEFAULT_NOTIFICATION_DURATION } from '@shared/constants'
import { useEventBus } from '@vueuse/core'
import dayjs from 'dayjs'
import { useNotification } from 'naive-ui'
import { VNodeChild } from 'vue'

import { onMainEvent } from '@renderer/utils/ipc'

interface LeagueAkariNotificationEvent {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string | (() => VNodeChild)
  content: string | (() => VNodeChild)
  error?: any
  options?: object
}

// League Akari 渲染进程消息通知
const bus = useEventBus<LeagueAkariNotificationEvent>(Symbol('notifications'))

export const laNotification = {
  info: (title: string, content: string, error?: any, options?: object) =>
    bus.emit({ type: 'info', title, content, error, options }),
  warn: (title: string, content: string, error?: any, options?: object) =>
    bus.emit({ type: 'warning', title, content, error, options }),
  error: (title: string, content: string, error?: any, options?: object) =>
    bus.emit({ type: 'error', title, content, error, options }),
  success: (title: string, content: string, error?: any, options?: object) =>
    bus.emit({ type: 'success', title, content, error, options })
}

// 用于 Naive UI 的通知事件展示
export function setupNaiveUiNotificationEvents() {
  const notification = useNotification()

  onMainEvent(
    'main-window/notification',
    (
      _,
      event: LeagueAkariNotificationEvent & { module: string; id?: string },
      options?: object
    ) => {
      notification.create({
        type: event.type,
        title: event.title,
        content: event.content,
        duration: LEAGUE_AKARI_DEFAULT_NOTIFICATION_DURATION,
        ...options
      })

      console.log(
        dayjs().format('HH:mm:ss'),
        event.type,
        event.title,
        event.content,
        event.error,
        event.module
      )
    }
  )

  bus.on((event) => {
    notification.create({
      type: event.type,
      title: event.title,
      content: event.content,
      duration: LEAGUE_AKARI_DEFAULT_NOTIFICATION_DURATION,
      ...event.options
    })

    console.log(dayjs().format('HH:mm:ss'), event.type, event.title, event.content, event.error)
  })
}
