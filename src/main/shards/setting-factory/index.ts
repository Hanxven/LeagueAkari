import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Paths } from '@shared/utils/types'

import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { StorageMain } from '../storage'
import { MobxSettingService } from './mobx-setting-service'

export type OnChangeCallback<T = any> = (
  newValue: T,
  extra: {
    oldValue: T
    key: string
    setter: (newValue?: T) => void | Promise<void>
  }
) => void | Promise<void>

export interface SettingSchema<T = any> {
  /**
   * 这个设置项的默认值
   */
  default: T

  /**
   * 实现该设置项的类型, 不提供将会直接修改状态值
   */
  onChange?: OnChangeCallback<T>
}

/**
 * 创建日志记录器的工厂, 供给其他模块使用
 * 在原有状态同步的基础上, 现在将会读取设置项以及接管设置项的变更
 */
export class SettingFactoryMain implements IAkariShardInitDispose {
  static id = 'setting-factory-main'
  static dependencies = ['storage-main', 'akari-ipc-main', 'mobx-utils-main']

  private readonly _ipc: AkariIpcMain
  private readonly _storage: StorageMain
  private readonly _mobx: MobxUtilsMain

  private readonly _settings: Map<string, MobxSettingService> = new Map()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._storage = deps['storage-main']
    this._mobx = deps['mobx-utils-main']
  }

  create<T extends object = any>(
    namespace: string,
    schema: Partial<Record<Paths<T>, SettingSchema>>,
    obj: T
  ) {
    if (this._settings.has(namespace)) {
      throw new Error(`namespace ${namespace} already created`)
    }

    const service = new MobxSettingService(this, SettingFactoryMain, namespace, schema, obj, {
      storage: this._storage
    })

    this._settings.set(namespace, service)
    return service
  }

  async onInit() {
    /**
     * 渲染进程请求获取设置项
     */
    this._ipc.onCall(
      SettingFactoryMain.id,
      'set',
      async (namespace: string, key: string, newValue: any) => {
        const service = this._settings.get(namespace)
        if (!service) {
          throw new Error(`namespace ${namespace} not found`)
        }

        await service.set(key, newValue)
      }
    )
  }

  async onDispose() {
    this._settings.clear()
  }
}
