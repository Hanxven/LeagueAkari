import { app } from 'electron'
import _ from 'lodash'
import { runInAction } from 'mobx'
import { existsSync, promises } from 'node:fs'
import { dirname, join } from 'path'

import { OnChangeCallback, SettingFactoryMain } from '.'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'

/**
 * 结合 mobx 状态同步的设置项服务
 * 耦合了状态和设置项读写的功能, 顺便还能读写 JSON 文件
 */
export class MobxSettingService {
  static CONFIG_DIR_NAME = 'AkariConfig'

  private readonly _storage: StorageMain

  constructor(
    private readonly _storageFactory: SettingFactoryMain,
    private readonly _C: typeof SettingFactoryMain,
    private readonly _namespace: string,
    // for accessibility
    public readonly _schema: Record<string, any>,
    public readonly _obj: object,
    _deps: any
  ) {
    this._storage = _deps.storage
  }

  /**
   * 拥有指定设置项吗？
   */
  _hasKeyInStorage(key: string) {
    const key2 = `${this._namespace}/${key}`
    return this._storage.dataSource.manager.existsBy(Setting, { key: key2 })
  }

  /**
   * 获取指定设置项的值
   * @param key
   * @param defaultValue
   * @returns
   */
  async _getFromStorage(key: string, defaultValue: any) {
    const key2 = `${this._namespace}/${key}`
    const v = await this._storage.dataSource.manager.findOneBy(Setting, { key: key2 })
    if (!v) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw new Error(`cannot find setting of key ${key}`)
    }

    return v.value
  }

  /**
   * 设置指定设置项的值
   * @param key
   * @param value
   */
  async _saveToStorage(key: string, value: any) {
    const key2 = `${this._namespace}/${key}`

    if (!key2 || value === undefined) {
      throw new Error('key or value cannot be empty')
    }

    await this._storage.dataSource.manager.save(Setting.create(key2, value))
  }

  /**
   * 删除设置项, 但通常没有用过
   * @param key
   */
  async _removeFromStorage(key: string) {
    const key2 = `${this._namespace}/${key}`
    if (!key2) {
      throw new Error('key is required')
    }

    await this._storage.dataSource.manager.delete(Setting, { key: key2 })
  }

  /**
   * 获取所有设置项
   */
  async _getAllFromStorage() {
    const items: Record<string, any> = {}
    const jobs = Object.entries(this._schema).map(async ([key, schema]) => {
      const value = await this._getFromStorage(key as any, schema.default)
      items[key] = value
    })
    await Promise.all(jobs)
    return items
  }

  /**
   * 获取设置项, 并存储到这个 mobx 对象中
   * @param obj Mobx Observable
   * @returns 所有设置项
   */
  async applyToState() {
    const items = await this._getAllFromStorage()
    Object.entries(items).forEach(([key, value]) => {
      _.set(this._obj, key, value)
    })
    return items
  }

  /**
   * 从应用目录读取某个 JSON 文件，提供一个文件名
   */
  async readFromJsonConfigFile<T = any>(filename: string): Promise<T> {
    if (!this._namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = join(
      app.getPath('userData'),
      MobxSettingService.CONFIG_DIR_NAME,
      this._namespace,
      filename
    )

    if (!existsSync(jsonPath)) {
      throw new Error(`config file ${filename} does not exist`)
    }

    // 读取 UTF-8 格式的 JSON 文件
    const content = await promises.readFile(jsonPath, 'utf-8')
    return JSON.parse(content)
  }

  /**
   * 将某个东西写入到 JSON 文件中，提供一个文件名
   */
  async writeToJsonConfigFile(filename: string, data: any) {
    if (!this._namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = join(
      app.getPath('userData'),
      MobxSettingService.CONFIG_DIR_NAME,
      this._namespace,
      filename
    )

    await promises.mkdir(dirname(jsonPath), { recursive: true })
    await promises.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * 检查某个 json 配置文件是否存在
   */
  async jsonConfigFileExists(filename: string) {
    if (!this._namespace) {
      throw new Error('domain is required')
    }

    const jsonPath = join(
      app.getPath('userData'),
      MobxSettingService.CONFIG_DIR_NAME,
      this._namespace,
      filename
    )

    return existsSync(jsonPath)
  }

  /**
   * 当某个设置项发生变化时, 拦截此行为
   * @param newValue
   * @param extra
   */
  onChange(key: string, fn: OnChangeCallback) {
    const _fn = this._schema[key].onChange
    // 重复设置, 会报错
    if (_fn) {
      throw new Error(`onChange for key ${key} already set`)
    }

    this._schema[key].onChange = fn
  }

  /**
   * 设置设置项的新值, 并更新状态
   * @param key
   * @param newValue
   */
  async set(key: string, newValue: any) {
    const fn = this._schema[key]?.onChange

    if (fn) {
      const oldValue = this._obj[key as any]
      await fn(newValue, {
        oldValue,
        key,
        setter: async (v?: any) => {
          if (v === undefined) {
            runInAction(() => _.set(this._obj, key, newValue))
            await this._saveToStorage(key as any, v)
          } else {
            runInAction(() => _.set(this._obj, key, v))
            await this._saveToStorage(key as any, newValue)
          }
        }
      })
    } else {
      runInAction(() => _.set(this._obj, key, newValue))
      await this._saveToStorage(key, newValue)
    }
  }

  /**
   * placeholder
   * @param key
   */
  remove(key: string): never {
    console.error(`Deemo will finally find his ${key}, not Celia but Alice`)
    throw new Error('not implemented')
  }
}
