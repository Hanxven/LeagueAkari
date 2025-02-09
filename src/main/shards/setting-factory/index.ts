import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Paths } from '@shared/utils/types'
import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

import { AkariIpcMain } from '../ipc'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'
import { SetterSettingService } from './setter-setting-service'

export type OnChangeCallback<T = any> = (
  newValue: T,
  extra: {
    oldValue: T
    key: string

    /** 提交到状态变更和数据库存储, 空值为继承 */
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
  static dependencies = ['storage-main', 'akari-ipc-main']

  private readonly _ipc: AkariIpcMain
  private readonly _storage: StorageMain

  private readonly _settings: Map<string, SetterSettingService> = new Map()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._storage = deps['storage-main']
  }

  register<T extends object = any>(
    namespace: string,
    schema: Partial<Record<Paths<T>, SettingSchema>>,
    obj: T
  ) {
    if (this._settings.has(namespace)) {
      throw new Error(`namespace ${namespace} already created`)
    }

    const service = new SetterSettingService(this, SettingFactoryMain, namespace, schema, obj, {
      storage: this._storage
    })

    this._settings.set(namespace, service)
    return service
  }

  /**
   * 拥有指定设置项吗？
   */
  _hasKeyInStorage(namespace: string, key: string) {
    const key2 = `${namespace}/${key}`
    return this._storage.dataSource.manager.existsBy(Setting, { key: key2 })
  }

  /**
   * 获取指定设置项的值
   * @param key
   * @param defaultValue
   * @returns
   */
  async _getFromStorage<T = any>(namespace: string, key: string): Promise<T | undefined>
  async _getFromStorage<T>(namespace: string, key: string, defaultValue: T): Promise<T>
  async _getFromStorage(namespace: string, key: string, defaultValue?: any) {
    const key2 = `${namespace}/${key}`
    const v = await this._storage.dataSource.manager.findOneBy(Setting, { key: key2 })
    if (!v) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      return undefined
    }

    return v.value
  }

  /**
   * 设置指定设置项的值
   * @param key
   * @param value
   */
  async _saveToStorage(namespace: string, key: string, value: any) {
    const key2 = `${namespace}/${key}`

    if (!key2 || value === undefined) {
      throw new Error('key or value cannot be empty')
    }

    await this._storage.dataSource.manager.save(Setting.create(key2, value))
  }

  /**
   * 删除设置项, 但通常没有用过
   * @param key
   */
  async _removeFromStorage(namespace: string, key: string) {
    const key2 = `${namespace}/${key}`
    if (!key2) {
      throw new Error('key is required')
    }

    await this._storage.dataSource.manager.delete(Setting, { key: key2 })
  }

  /**
   * 从应用目录读取某个 JSON 文件，提供一个文件名
   */
  async readFromJsonConfigFile<T = any>(namespace: string, filename: string): Promise<T> {
    if (!namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = path.join(
      app.getPath('userData'),
      SetterSettingService.CONFIG_DIR_NAME,
      namespace,
      filename
    )

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`config file ${filename} does not exist`)
    }

    // 读取 UTF-8 格式的 JSON 文件
    const content = await fs.promises.readFile(jsonPath, 'utf-8')
    return JSON.parse(content)
  }

  /**
   * 将某个东西写入到 JSON 文件中，提供一个文件名
   */
  async writeToJsonConfigFile(namespace: string, filename: string, data: any) {
    if (!namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = path.join(
      app.getPath('userData'),
      SetterSettingService.CONFIG_DIR_NAME,
      namespace,
      filename
    )

    await fs.promises.mkdir(path.dirname(jsonPath), { recursive: true })
    await fs.promises.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * 检查某个 json 配置文件是否存在
   */
  async jsonConfigFileExists(namespace: string, filename: string) {
    if (!namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = path.join(
      app.getPath('userData'),
      SetterSettingService.CONFIG_DIR_NAME,
      namespace,
      filename
    )

    return fs.existsSync(jsonPath)
  }

  async onInit() {
    /**
     * 渲染进程请求获取设置项
     */
    this._ipc.onCall(
      SettingFactoryMain.id,
      'set',
      async (_, namespace: string, key: string, newValue: any) => {
        const service = this._settings.get(namespace)

        if (service) {
          await service.set(key, newValue)
        } else {
          await this._saveToStorage(namespace, key, newValue)
        }
      }
    )

    this._ipc.onCall(SettingFactoryMain.id, 'get', async (_, namespace: string, key: string) => {
      const service = this._settings.get(namespace)
      if (service) {
        return service.get(key)
      }

      return this._getFromStorage(namespace, key)
    })
  }

  async onDispose() {
    this._settings.clear()
  }
}
