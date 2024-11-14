import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { RadixEventEmitter } from '@shared/event-emitter'
import { LcuEvent } from '@shared/types/league-client/event'
import dayjs from 'dayjs'
import { effectScope, watch } from 'vue'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useRendererDebugStore } from './store'

const MAIN_SHARD_NAMESPACE = 'renderer-debug-main'

export class RendererDebugRenderer implements IAkariShardInitDispose {
  static id = 'renderer-debug-renderer'
  static dependencies = ['akari-ipc-renderer', 'pinia-mobx-utils-renderer']

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer

  private readonly _matcher = new RadixEventEmitter()
  private readonly _scope = effectScope()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
  }

  async onInit() {
    const store = useRendererDebugStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    this._ipc.onEvent(MAIN_SHARD_NAMESPACE, 'lc-event', (data: LcuEvent) => {
      if (store.printAll) {
        this.log(data.uri, data.eventType, data.data)
      } else {
        // forward again~
        this._matcher.emit(data.uri, data)
      }
    })

    this._scope.run(() => {
      watch([() => store.rules.length, () => store.printAll], ([len, printAll]) => {
        if (len || printAll) {
          this.setSendAllNativeLcuEvents(true)
        } else {
          this.setSendAllNativeLcuEvents(false)
        }
      })
    })
  }

  log(uri: string, type: string, ...args: any[]) {
    console.info(
      `%c[${dayjs().format('HH:mm:ss')}] %c[%c${uri}%c] %c[${type}]`,
      'color: #3938fb; font-weight: bold;',
      'color: inherit;',
      'color: #2e2571; font-weight: bold;',
      'color: inherit;',
      'color: #000c3c; font-weight: bold;',
      ...args
    )
  }

  private _sanitizeRule(rule: string) {
    return rule
      .replace(/\/+$/, '') // 去除结尾的斜杠
      .replace(/^([^/])/, '/$1') // 补足前面的斜杠
      .replace(/\/{2,}/g, '/')
  }

  addRule(rule: string) {
    const store = useRendererDebugStore()

    if (store.rules.some((r) => r.rule === rule)) {
      return
    }

    rule = this._sanitizeRule(rule)

    const stopFn = this._matcher.on(rule, (data) => {
      if (!store.printAll) {
        this.log(data.uri, data.eventType, data.data)
      }
    })

    store.rules.push({
      rule,
      stopFn,
      enabled: true
    })
  }

  enableRule(rule: string) {
    const store = useRendererDebugStore()

    const ruleO = store.rules.find((r) => r.rule === rule)

    if (!ruleO) {
      return
    }

    ruleO.stopFn?.()
    ruleO.enabled = true

    const stopFn = this._matcher.on(rule, (data) => {
      if (!store.printAll) {
        this.log(data.uri, data.eventType, data.data)
      }
    })

    ruleO.stopFn = stopFn
  }

  disableRule(rule: string) {
    const store = useRendererDebugStore()

    const ruleO = store.rules.find((r) => r.rule === rule)

    if (!ruleO) {
      return
    }

    ruleO.enabled = false
    ruleO.stopFn?.()
  }

  removeRule(rule: string) {
    const store = useRendererDebugStore()

    const i = store.rules.findIndex((r) => r.rule === rule)

    if (i === -1) {
      return
    }

    store.rules[i].stopFn?.()
    store.rules.splice(i, 1)
  }

  async onDispose() {
    this._scope.stop()
  }

  setSendAllNativeLcuEvents(value: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setSendAllNativeLcuEvents', value)
  }
}
