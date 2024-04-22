import { RadixEventEmitter } from '@shared/event-emitter'
import { watch } from 'vue'

import { gameClientRequest, request } from '@renderer/http-api/common'
import { router } from '@renderer/routes'
import { ipcMainCallStandardized, mainCall, onMainEvent } from '@renderer/utils/ipc'

import { useDebugStore } from './store'

const matcher = new RadixEventEmitter()

// 构建 Debug 相关的功能，仅限本渲染进程，所有数据都是临时
export async function setupDebug() {
  const debug = useDebugStore()

  // 全局功能
  // @ts-ignore
  window.lcuRequest = request
  // @ts-ignore
  window.gameClientRequest = gameClientRequest
  // @ts-ignore
  window.router = router
  // @ts-ignore
  window.mainCall = mainCall

  watch([() => debug.settings.printAllLcuEvents, debug.settings.printRules], ([a, r]) => {
    if (a || Object.values(r).some((r) => r.enabled)) {
      mainCall('debug/settings/send-all-native-lcu-events/set', true)
    } else {
      mainCall('debug/settings/send-all-native-lcu-events/set', false)
    }
  })

  onMainEvent('debug/native-lcu-event', (_, data) => {
    matcher.emit(data.uri, data)
  })

  matcher.on('/**', (data) => {
    if (debug.settings.printAllLcuEvents) {
      console.log(data.uri, data.eventType, data.data)
    }
  })
}

export function addPrintRule(rule: string) {
  const settings = useDebugStore()

  rule = rule
    .replace(/\/+$/, '') // 去除结尾的斜杠
    .replace(/^([^/])/, '/$1') // 补足前面的斜杠
    .replace(/\/{2,}/g, '/') // 去除连续的斜杠

  if (settings.settings.printRules[rule]) {
    return
  }

  settings.settings.printRules[rule] = {
    enabled: true,
    stopHandle: null
  }

  enablePrintRule(rule)
}

export function enablePrintRule(rule: string) {
  const settings = useDebugStore()

  if (!settings.settings.printRules[rule]) {
    return
  }

  const ruleObj = settings.settings.printRules[rule]

  if (ruleObj.stopHandle) {
    ruleObj.stopHandle()
  }

  ruleObj.enabled = true

  const stop = matcher.on(rule, (data) => {
    if (!settings.settings.printAllLcuEvents) {
      console.log(data.uri, data.eventType, data.data)
    }
  })

  ruleObj.stopHandle = stop
}

export function disablePrintRule(rule: string) {
  const settings = useDebugStore()

  if (!settings.settings.printRules[rule]) {
    return
  }

  const ruleObj = settings.settings.printRules[rule]

  ruleObj.enabled = false

  if (ruleObj.stopHandle) {
    ruleObj.stopHandle()
  }
}

export function removePrintRule(rule: string) {
  const settings = useDebugStore()

  disablePrintRule(rule)
  delete settings.settings.printRules[rule]
}
