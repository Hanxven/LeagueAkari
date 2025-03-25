import _ from 'lodash'
import { runInAction } from 'mobx'

import { OnChangeCallback, SettingFactoryMain } from '.'

/**
 * 在更新设置时同时更改状态, 状态同步的设置项服务
 * 耦合了状态和设置项读写的功能, 顺便还能读写 JSON 文件
 */
export class SetterSettingService {
  static CONFIG_DIR_NAME = 'AkariConfig'

  constructor(
    private readonly _ins: SettingFactoryMain,
    private readonly _C: typeof SettingFactoryMain,
    private readonly _namespace: string,
    // for accessibility
    public readonly _schema: Record<string, any>,
    public readonly _obj: object,
    _deps: any
  ) {}

  _getFromStorage(key: string, defaultValue?: any) {
    return this._ins._getFromStorage(this._namespace, key, defaultValue)
  }

  _saveToStorage(key: string, value: any) {
    return this._ins._saveToStorage(this._namespace, key, value)
  }

  _getValuesFromStorage(key: string) {
    return this._ins._getValuesFromStorage(this._namespace, key)
  }

  _setJsonValue(key: string, path: string, value: any) {
    return this._ins._setJsonValue(this._namespace, key, path, value)
  }

  _removeJsonValue(key: string, path: string) {
    return this._ins._removeJsonValue(this._namespace, key, path)
  }

  /**
   * 获取所有设置项
   */
  async _getAllFromStorage() {
    const items: Record<string, any> = {}
    const jobs = Object.entries(this._schema).map(async ([key, schema]) => {
      const value = await this._ins._getFromStorage(this._namespace, key as any, schema.default)
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

  async readFromJsonConfigFile<T = any>(filename: string): Promise<T> {
    return this._ins.readFromJsonConfigFile(this._namespace, filename)
  }

  async writeToJsonConfigFile(filename: string, data: any) {
    return this._ins.writeToJsonConfigFile(this._namespace, filename, data)
  }

  async jsonConfigFileExists(filename: string) {
    return this._ins.jsonConfigFileExists(this._namespace, filename)
  }

  /**
   * 当某个设置项发生变化时, 拦截此行为
   * @param newValue
   * @param extra
   */
  onChange(key: string, fn: OnChangeCallback) {
    if (!this._schema[key]) {
      throw new Error(`key ${key} not found in schema`)
    }

    const _fn = this._schema[key].onChange
    // 重复设置, 会报错
    if (_fn) {
      throw new Error(`onChange for key ${key} already set`)
    }

    this._schema[key].onChange = fn
  }

  /**
   * 设置设置项的新值, 并**更新状态**
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

            if (newValue === null) {
              await this._ins._removeFromStorage(this._namespace, key)
            } else {
              await this._ins._saveToStorage(this._namespace, key as any, newValue)
            }
          } else {
            runInAction(() => _.set(this._obj, key, v))

            if (v === null) {
              await this._ins._removeFromStorage(this._namespace, key)
            } else {
              await this._ins._saveToStorage(this._namespace, key as any, v)
            }
          }
        }
      })
    } else {
      runInAction(() => _.set(this._obj, key, newValue))

      if (newValue === null) {
        await this._ins._removeFromStorage(this._namespace, key)
      } else {
        await this._ins._saveToStorage(this._namespace, key, newValue)
      }
    }
  }

  async get(key: string) {
    return _.get(this._obj, key)
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
