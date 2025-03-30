import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Paths } from '@shared/utils/types'
import _ from 'lodash'
import { WatchOptions, toRaw, watch } from 'vue'

import { AkariIpcRenderer } from '../ipc'

export const MAIN_SHARD_NAMESPACE = 'setting-factory-main'

@Shard(SettingUtilsRenderer.id)
export class SettingUtilsRenderer implements IAkariShardInitDispose {
  static id = 'setting-utils-renderer'

  private _stopHandles = new Set<Function>()

  constructor(@Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer) {}

  set(namespace: string, key: string, value: any) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'set', namespace, key, value)
  }

  async get(namespace: string, key: string, defaultValue?: any) {
    return (await this._ipc.call(MAIN_SHARD_NAMESPACE, 'get', namespace, key)) ?? defaultValue
  }

  exportSettingsToJsonFile() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'exportSettingsToJsonFile')
  }

  importSettingsFromJsonFile() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'importSettingsFromJsonFile')
  }

  /**
   * 远古工具方法 2.0, 仅用于渲染进程的某些数据存储和初始化
   * 用于持久化某些仅用于渲染进程的数据
   */
  async savedGetterVue(
    namespace: string,
    key: string,
    getter: () => any,
    initValueSetter: (value: any) => void
  ) {
    initValueSetter(await this.get(namespace, key, getter()))
    const stopHandle = watch(getter, (value) => {
      this.set(namespace, key, toRaw(value))
    })
    this._stopHandles.add(stopHandle)
  }

  async savedPropVue<T extends object>(
    namespace: string,
    object: T,
    propKey: Paths<T>,
    options: {
      savePropKey?: string
      watchOptions?: WatchOptions
    } = {}
  ) {
    const { savePropKey, watchOptions } = options

    const value = await this.get(
      namespace,
      savePropKey ? savePropKey : propKey,
      _.get(object, propKey)
    )
    _.set(object, propKey, value)
    const stopHandle = watch(
      () => _.get(object, propKey),
      (value) => {
        this.set(namespace, savePropKey ? savePropKey : propKey, toRaw(value))
      },
      watchOptions
    )
    this._stopHandles.add(stopHandle)
  }

  async onDispose() {
    for (const stopHandle of this._stopHandles) {
      stopHandle()
    }
  }
}
