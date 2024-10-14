import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Paths } from '@shared/utils/types'
import { get } from 'lodash'
import { IReactionOptions, IReactionPublic, reaction, toJS } from 'mobx'

import { AkariIpcMain } from '../ipc'

interface RegisteredState {
  object: object
  props: Map<string, { raw: boolean }>
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

/**
 * 封装的 Mobx 工具方法, 负责状态同步
 */
export class MobxUtilsMain implements IAkariShardInitDispose {
  static id = 'mobx-utils-main'
  static dependencies = ['akari-ipc-main']

  private readonly _ipc: AkariIpcMain

  private readonly _disposables = new Set<Function>()
  protected readonly _registeredStates = new Map<string, RegisteredState>()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
  }

  async onInit() {
    // 用于渲染进程获取初始定义的状态列表
    this._ipc.onCall(MobxUtilsMain.id, 'get-state-props', (namespace: string, stateId: string) => {
      const key = `${namespace}:${stateId}`
      if (!this._registeredStates.has(key)) {
        throw new Error(`State ${key} not found`)
      }

      const props = Array.from(this._registeredStates.get(key)!.props.entries()).map(
        ([path, config]) => ({
          path,
          raw: config.raw
        })
      )

      return props
    })

    // 用于渲染进程获取状态的属性值
    this._ipc.onCall(
      MobxUtilsMain.id,
      'get-state-prop-value',
      (namespace: string, stateId: string, propPath: string) => {
        const key = `${namespace}:${stateId}`
        if (!this._registeredStates.has(key)) {
          throw new Error(`State ${key} not found`)
        }

        if (!this._registeredStates.get(key)!.props.has(propPath)) {
          throw new Error(`No registered prop path ${propPath} for ${key}`)
        }

        const item = this._registeredStates.get(key)!
        const prop = item.props.get(propPath)!

        const value = prop.raw ? toJS(get(item.object, propPath)) : get(item.object, propPath)
        return value
      }
    )
  }

  async onDispose() {
    this._disposables.forEach((dispose) => dispose())
    this._disposables.clear()
    this._registeredStates.clear()
  }

  /**
   * 在本地的 Mobx 状态对象上注册任意个属性, 当发生变化时, 推送一个事件
   * @param namespace 命名空间
   * @param stateId 状态 ID
   * @param obj Mobx 状态对象
   * @param propPath 属性路径
   * @param raw 是否需要转换成 mobx 原始对象, 避免无法序列化
   */
  propSync<T extends object>(
    namespace: string,
    stateId: string,
    obj: T,
    propPath: Paths<T> | Paths<T>[],
    raw = false
  ) {
    const key = `${namespace}:${stateId}`
    if (!this._registeredStates.has(key)) {
      this._registeredStates.set(key, {
        object: obj,
        props: new Map()
      })
    }

    const config = this._registeredStates.get(key)!

    if (config.object !== obj) {
      throw new Error(`State ${key} already registered with different object`)
    }

    const paths = Array.isArray(propPath) ? propPath : [propPath]

    for (const path of paths) {
      if (config.props.has(path)) {
        throw new Error(`Prop path ${path} already registered for ${stateId}`)
      }

      config.props.set(path, { raw })

      const fn = reaction(
        () => get(obj, path),
        (newValue) => {
          this._ipc.sendEvent(
            namespace,
            `update-state-prop/${stateId}`,
            path,
            raw ? toJS(newValue) : newValue,
            raw
          )
        }
      )

      this._disposables.add(fn)
    }
  }

  /**
   * 和 Mobx 的 reaction 方法类似, 但是会管理 reaction 的销毁
   */
  reaction<T, FireImmediately extends boolean = false>(
    expression: (r: IReactionPublic) => T,
    effect: (
      arg: T,
      prev: FireImmediately extends true ? T | undefined : T,
      r: IReactionPublic
    ) => void,
    opts?: IReactionOptions<T, FireImmediately>
  ): () => void {
    const disposer = reaction(expression, effect, opts)
    this._disposables.add(disposer)

    return () => {
      if (this._disposables.has(disposer)) {
        this._disposables.delete(disposer)
        disposer()
      }
    }
  }

  /*
    更改
   */
  mutateProp(namespace: string, stateId: string, propPath: string, value: any) {
    const key = `${namespace}:${stateId}`
    if (!this._registeredStates.has(key)) {
      throw new Error(`State ${key} not found`)
    }

    if (!this._registeredStates.get(key)!.props.has(propPath)) {
      throw new Error(`No registered prop path ${propPath} for ${key}`)
    }

    const item = this._registeredStates.get(key)!
    const prop = item.props.get(propPath)!

    // 如果存在设置器

    if (prop.raw) {
      value = toJS(value)
    }

    // set(item.object, propPath, value)
  }
}
