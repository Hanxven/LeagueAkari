import { gameClientRequest, request } from '@renderer/http-api/common'
import { call } from '@renderer/ipc'
import { router } from '@renderer/routes'

import { useSettingsStore } from './stores/settings'
import { onLcuEvent } from './update/lcu-events'

// 构建 Debug 相关的功能
export function setupDebug() {
  const settings = useSettingsStore()

  // 全局功能
  // @ts-ignore
  window.lcuRequest = request
  // @ts-ignore
  window.gameClientRequest = gameClientRequest
  // @ts-ignore
  window.onLcuEvent = onLcuEvent
  // @ts-ignore
  window.router = router
  // @ts-ignore
  window.call = call

  onLcuEvent('/**', (event) => {
    if (settings.debug.printAllLcuEvents) {
      console.log(event.uri, event.eventType, event.data)
    }
  })
}

export function addPrintRule(rule: string) {
  const settings = useSettingsStore()

  rule = rule
    .replace(/\/+$/, '') // 去除结尾的斜杠
    .replace(/^([^/])/, '/$1') // 补足前面的斜杠
    .replace(/\/{2,}/g, '/') // 去除连续的斜杠

  if (settings.debug.printRules[rule]) {
    return
  }

  settings.debug.printRules[rule] = {
    enabled: true,
    stopHandle: null
  }

  enablePrintRule(rule)
}

export function enablePrintRule(rule: string) {
  const settings = useSettingsStore()

  if (!settings.debug.printRules[rule]) {
    return
  }

  const ruleObj = settings.debug.printRules[rule]

  if (ruleObj.stopHandle) {
    ruleObj.stopHandle()
  }

  ruleObj.enabled = true

  const stop = onLcuEvent(rule, (event) => {
    if (!settings.debug.printAllLcuEvents) {
      console.log(event.uri, event.eventType, event.data)
    }
  })

  ruleObj.stopHandle = stop
}

export function disablePrintRule(rule: string) {
  const settings = useSettingsStore()

  if (!settings.debug.printRules[rule]) {
    return
  }

  const ruleObj = settings.debug.printRules[rule]

  ruleObj.enabled = false

  if (ruleObj.stopHandle) {
    ruleObj.stopHandle()
  }
}

export function removePrintRule(rule: string) {
  const settings = useSettingsStore()

  disablePrintRule(rule)
  delete settings.debug.printRules[rule]
}
