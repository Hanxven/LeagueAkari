import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import _ from 'lodash'
import { markRaw } from 'vue'

import { AkariIpcRenderer } from '../ipc'

// 对应主进程相应模块
export const MAIN_SHARD_NAMESPACE = 'mobx-utils-main'

/**
 * 对应主进程模块, 适用于 Pinia 的状态同步器
 */
export class PiniaMobxUtilsRenderer implements IAkariShardInitDispose {
  static id = 'pinia-mobx-utils-renderer'
  static dependencies = ['akari-ipc-renderer']

  private readonly _ipc: AkariIpcRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
  }

  async sync(namespace: string, stateId: string, store: any) {
    this._ipc.onEvent(
      MAIN_SHARD_NAMESPACE,
      `update-state-prop/${namespace}:${stateId}`,
      (path, value, { action }) => {
        if (action === 'update' || action === 'create') {
          _.set(store, path, _.isObject(value) ? markRaw(value) : value)
        } else if (action === 'delete') {
          _.unset(store, path)
        }
      }
    )

    const initial: Record<string, any> = await this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'getInitialState',
      namespace,
      stateId
    )

    Object.entries(initial).forEach(([key, value]) => {
      _.set(store, key, _.isObject(value) ? markRaw(value) : value)
    })
  }

  async onInit() {}

  async onDispose() {}
}
