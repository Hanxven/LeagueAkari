import { app } from 'electron'
import { set } from 'lodash'
import { existsSync, promises } from 'node:fs'
import { dirname, join } from 'path'

import { SettingFactoryMain } from '.'
import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'

/**
 * 结合 mobx 状态同步的设置项服务
 */
export class MobxSettingService {
  static CONFIG_DIR_NAME = 'AkariConfig'

  private readonly _storage: StorageMain
  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain

  constructor(
    private readonly _storageFactory: SettingFactoryMain,
    private readonly _C: typeof SettingFactoryMain,
    private readonly _namespace: string,
    public readonly _schema: Record<string, any>,
    public readonly _obj: object,
    _deps: any
  ) {
    this._storage = _deps.storage
    this._ipc = _deps.ipc
    this._mobx = _deps.mobx
  }

  /**
   * 拥有指定设置项吗？
   */
  has(key: string) {
    const key2 = `${this._namespace}/${key}`
    return this._storage.dataSource.manager.existsBy(Setting, { key: key2 })
  }

  /**
   * 获取指定设置项的值
   * @param key
   * @param defaultValue
   * @returns
   */
  async get<T = any>(key: string, defaultValue: T) {
    const key2 = `${this._namespace}/${key}`
    const v = await this._storage.dataSource.manager.findOneBy(Setting, { key: key2 })
    if (!v) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw new Error(`cannot find setting of key ${key}`)
    }

    return v.value as T
  }

  /**
   * 设置指定设置项的值
   * @param key
   * @param value
   */
  async set(key: string, value: any) {
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
  async remove(key: string) {
    const key2 = `${this._namespace}/${key}`
    if (!key2) {
      throw new Error('key is required')
    }

    await this._storage.dataSource.manager.delete(Setting, { key: key2 })
  }

  /**
   * 获取所有设置项
   */
  async getAll() {
    const items: Record<string, any> = {}
    const jobs = Object.entries(this._schema).map(async ([key, schema]) => {
      const value = await this.get(key, schema.default)
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
  async applySettingsToState() {
    const items = await this.getAll()
    Object.entries(items).forEach(([key, value]) => {
      set(this._obj, key, value)
    })
    return items
  }

  /**
   * 从应用目录读取某个 JSON 文件，提供一个文件名
   */
  async readFromJsonConfig<T = any>(filename: string): Promise<T> {
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
  async writeToJsonConfig(filename: string, data: any) {
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
  async jsonConfigExists(filename: string) {
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
}
