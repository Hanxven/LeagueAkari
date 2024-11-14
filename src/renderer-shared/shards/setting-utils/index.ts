import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { effectScope, toRaw, watch } from 'vue'

import { AkariIpcRenderer } from '../ipc'

export const MAIN_SHARD_NAMESPACE = 'setting-factory-main'

export class SettingUtilsRenderer implements IAkariShardInitDispose {
  static id = 'setting-utils-renderer'
  static dependencies = ['akari-ipc-renderer']

  private _ipc: AkariIpcRenderer

  private _stopHandles = new Set<Function>()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
  }

  set(namespace: string, key: string, value: any) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'set', namespace, key, value)
  }

  async get(namespace: string, key: string, defaultValue?: any) {
    return (await this._ipc.call(MAIN_SHARD_NAMESPACE, 'get', namespace, key)) ?? defaultValue
  }

  /**
   * 远古工具方法 2.0, 仅用于渲染进程的某些数据存储和初始化
   */
  async autoSaveProp(
    namespace: string,
    key: string,
    getter: () => any,
    setter: (value: any) => void
  ) {
    const stopHandle = watch(
      getter,
      (value) => {
        this.set(namespace, key, toRaw(value))
      },
      { immediate: true }
    )
    this._stopHandles.add(stopHandle)
    setter(await this.get(namespace, key, getter()))
  }

  async onDispose() {
    for (const stopHandle of this._stopHandles) {
      stopHandle()
    }
  }
}
