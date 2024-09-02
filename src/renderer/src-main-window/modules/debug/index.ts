import { RadixEventEmitter } from '@shared/event-emitter'
import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'
import { gameClientRequest, request as lcuRequest } from '@renderer-shared/http-api/common'
import { request as rcRequest } from '@renderer-shared/rc-http-api/common'
import { watch } from 'vue'

import { router } from '@main-window/routes'

import { useDebugStore } from './store'

export class DebugRendererModule extends StateSyncModule {
  private _matcher = new RadixEventEmitter()

  constructor() {
    super('debug')
  }

  override async setup() {
    await super.setup()

    // 全局功能
    // @ts-ignore
    window.lcuRequest = lcuRequest
    // @ts-ignore
    window.rcRequest = rcRequest
    // @ts-ignore
    window.gameClientRequest = gameClientRequest
    // @ts-ignore
    window.router = router

    this.onEvent('lcu-event', (data) => {
      this._matcher.emit(data.uri, data)
    })

    const store = useDebugStore()

    watch([() => store.settings.printAllLcuEvents, store.settings.printRules], ([a, r]) => {
      if (a || Object.values(r).some((r) => r.enabled)) {
        this.call('set-setting/send-all-native-lcu-events', true)
      } else {
        this.call('set-setting/send-all-native-lcu-events', false)
      }
    })

    this._matcher.on('/**', (data) => {
      if (store.settings.printAllLcuEvents) {
        console.log(data.uri, data.eventType, data.data)
      }
    })
  }

  addPrintRule(rule: string) {
    const store = useDebugStore()

    rule = rule
      .replace(/\/+$/, '') // 去除结尾的斜杠
      .replace(/^([^/])/, '/$1') // 补足前面的斜杠
      .replace(/\/{2,}/g, '/') // 去除连续的斜杠

    if (store.settings.printRules[rule]) {
      return
    }

    store.settings.printRules[rule] = {
      enabled: true,
      stopHandle: null
    }

    this.enablePrintRule(rule)
  }

  enablePrintRule(rule: string) {
    const store = useDebugStore()

    if (!store.settings.printRules[rule]) {
      return
    }

    const ruleObj = store.settings.printRules[rule]

    if (ruleObj.stopHandle) {
      ruleObj.stopHandle()
    }

    ruleObj.enabled = true

    const stop = this._matcher.on(rule, (data) => {
      if (!store.settings.printAllLcuEvents) {
        console.log(data.uri, data.eventType, data.data)
      }
    })

    ruleObj.stopHandle = stop
  }

  disablePrintRule(rule: string) {
    const store = useDebugStore()

    if (!store.settings.printRules[rule]) {
      return
    }

    const ruleObj = store.settings.printRules[rule]

    ruleObj.enabled = false

    if (ruleObj.stopHandle) {
      ruleObj.stopHandle()
    }
  }

  removePrintRule(rule: string) {
    const store = useDebugStore()

    this.disablePrintRule(rule)
    delete store.settings.printRules[rule]
  }
}

export const debugRendererModule = new DebugRendererModule()
