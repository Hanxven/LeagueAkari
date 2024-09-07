import { SettingService, StorageModule } from '@main/modules/akari-core/storage'
import { Paths } from '@shared/utils/types'
import { get, set } from 'lodash'
import { IReactionOptions, IReactionPublic, reaction, toJS } from 'mobx'

import { LeagueAkariModule } from './akari-module'

/**
 * 对于简单的状态，通常是 ref 或者 structural 状态量
 */
type SimpleStateGetter = () => any

type StateSetter = (
  value: any,
  defaultBehavior: () => void, // 原本提供的默认设置行为
  ss: SettingService
) => void | Promise<boolean>

interface RegisteredState {
  object: object
  props: Map<string, { toRaw: boolean }>
}

export type RegisteredSettingHandler = (
  key: string,

  /**
   * 当前值
   */
  value: any,

  /**
   * 存储到设置项, 仍可以更改其他设置项的值
   */
  apply: (key: string, value: any) => Promise<void>
) => Promise<any> | any

interface RegisteredSettingConfig {
  // 默认值
  defaultValue: any

  // 处理函数, apply 用于应用修改
  handlers: Set<RegisteredSettingHandler>
}

/**
 * 实现了一些基于 Mobx 的简单状态管理封装，该模块依赖于 `storage` 模块。
 */
export class MobxBasedBasicModule extends LeagueAkariModule {
  protected _disposers = new Set<Function>()
  protected _sm: StorageModule
  protected _ss: SettingService
  protected _settingsToSync: Promise<void>[] = []

  protected _registeredStates = new Map<string, RegisteredState>()
  protected _registeredSettings = new Map<string, RegisteredSettingConfig>()

  /**
   * an alias for this._sm
   */
  protected get _storageModule() {
    return this._sm
  }

  /**
   * an alias for this._ss
   */
  protected get _settingService() {
    return this._ss
  }

  override async setup() {
    await super.setup()

    try {
      this._sm = this.manager.getModule('storage')
      this._ss = this._sm.settings.with(this.id)
    } catch (error) {
      throw new Error('MobxBasedModule requires StorageModule')
    }

    this.onCall('get-state-props', (stateId: string) => {
      if (!this._registeredStates.has(stateId)) {
        throw new Error(`No registered state for ${stateId}`)
      }

      return Array.from(this._registeredStates.get(stateId)!.props.entries()).map(
        ([path, config]) => ({
          path,
          toRaw: config.toRaw
        })
      )
    })

    this.onCall('get-state-prop', (stateId: string, propPath: string) => {
      if (!this._registeredStates.has(stateId)) {
        throw new Error(`No registered state for ${stateId}`)
      }

      if (!this._registeredStates.get(stateId)!.props.has(propPath)) {
        throw new Error(`No registered prop path ${propPath} for ${stateId}`)
      }

      const item = this._registeredStates.get(stateId)!
      const prop = item.props.get(propPath)!

      return prop.toRaw ? toJS(get(item.object, propPath)) : get(item.object, propPath)
    })

    this.onCall('set-state-prop', (stateId: string, propPath: string, value: any) => {
      if (!this._registeredStates.has(stateId)) {
        throw new Error(`No registered state for ${stateId}`)
      }

      const config = this._registeredStates.get(stateId)!

      if (!config.props.has(propPath)) {
        throw new Error(`No registered prop path ${propPath} for ${stateId}`)
      }

      set(config.object, propPath, value)
    })

    this.onCall('set-setting', async (key: string, value: any) => {
      if (!this._registeredSettings.has(key)) {
        throw new Error(`No registered setting for ${key}`)
      }

      const handlers = this._registeredSettings.get(key)!.handlers

      const applyFn = async (key: string, value: any) => {
        if (value !== undefined) {
          await this._ss.set(key, value)
          return
        }

        await this._ss.set(key, value)
      }

      for (const handler of handlers.values()) {
        await handler(key, value, applyFn)
      }
    })
  }

  /**
   * 测试性的
   * 注册一个设置项的监听器
   * @param key 设置项名称
   * @param handler 设置项变化时的处理函数
   */
  onSettingChange<T extends string>(key: T, handler: RegisteredSettingHandler) {
    if (!this._registeredSettings.has(key)) {
      throw new Error(`No registered setting for ${key}`)
    }

    this._registeredSettings.get(key)!.handlers.add(handler)

    return () => {
      this._registeredSettings.get(key)!.handlers.delete(handler)
    }
  }

  /**
   * 注册可用设置项
   * @param items
   */
  async registerSettings(
    items: {
      key: string
      defaultValue: any
    }[]
  ) {
    for (const item of items) {
      this._registeredSettings.set(item.key, {
        defaultValue: item.defaultValue,
        handlers: new Set()
      })
    }
  }

  /**
   * 读取注册的设置项
   * @returns
   */
  async readSettings() {
    const read = async (settingItem: string, defaultValue: any) => {
      return {
        settingItem,
        value: await this._ss.get(settingItem, defaultValue)
      }
    }

    const items = Array.from(this._registeredSettings.entries())
    return await Promise.all(
      items.map(([settingItem, config]) => read(settingItem, config.defaultValue))
    )
  }

  /**
   * 通过提供一个 getter 监听资源
   * @param resName 资源名称
   * @param getter 资源 getter
   */
  getterSync(resName: string, getter: SimpleStateGetter, toRaw = false) {
    this.reaction(getter, (newValue) => {
      this.sendEvent(`update-getter/${resName}`, toRaw ? toJS(newValue) : newValue)
    })
    this.onCall(`get-getter/${resName}`, () => (toRaw ? toJS(getter()) : getter()))
  }

  propSync<T extends object>(
    stateId: string,
    obj: T,
    propPath: Paths<T> | Paths<T>[],
    toRaw = false
  ) {
    if (!this._registeredStates.has(stateId)) {
      this._registeredStates.set(stateId, {
        object: obj,
        props: new Map()
      })
    }

    const config = this._registeredStates.get(stateId)!

    if (config.object !== obj) {
      throw new Error(`State ID ${stateId} already registered for another object`)
    }

    const paths = Array.isArray(propPath) ? propPath : [propPath]

    for (const path of paths) {
      if (config.props.has(path)) {
        throw new Error(`Prop path ${path} already registered for ${stateId}`)
      }

      config.props.set(path, { toRaw })

      this.reaction(
        () => get(obj, path),
        (newValue) => {
          this.sendEvent(
            `update-state-prop/${stateId}`,
            path,
            toRaw ? toJS(newValue) : newValue,
            toRaw
          )
        }
      )
    }
  }

  /**
   * 手动推送一个变化到渲染进程
   * @param stateId 状态 ID
   * @param propPath 属性路径
   * @param value 新值
   * @param toRaw 是否转换为普通对象
   */
  propUpdateEvent<T extends object = any>(
    stateId: string,
    propPath: Paths<T>,
    value: any,
    toRaw = false
  ) {
    this.sendEvent(`update-state-prop/${stateId}`, propPath, toRaw ? toJS(value) : value, toRaw)
  }

  /**
   * mobx `reaction` 封装，会在 unregister 时自动清除
   */
  reaction<T, FireImmediately extends boolean = false>(
    expression: (r: IReactionPublic) => T,
    effect: (
      arg: T,
      prev: FireImmediately extends true ? T | undefined : T,
      r: IReactionPublic
    ) => void,
    opts?: IReactionOptions<T, FireImmediately>
  ) {
    const fn = reaction(expression, effect, opts)
    this._disposers.add(fn)

    return () => {
      if (this._disposers.has(fn)) {
        fn()
        this._disposers.delete(fn)
      }
    }
  }

  override async dispose() {
    await super.dispose()
    this._disposers.forEach((fn) => fn())
    this._disposers.clear()
    this._registeredStates.clear()
    this._registeredSettings.clear()
  }
}
