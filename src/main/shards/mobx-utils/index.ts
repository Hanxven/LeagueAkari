import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Paths } from '@shared/utils/types'
import _ from 'lodash'
import { IReactionOptions, IReactionPublic, isObservable, reaction, toJS } from 'mobx'

import { AkariIpcMain } from '../ipc'

interface RegisteredState {
  object: object
  props: Map<
    string,
    {
      /* 留空, 方便未来的封装 */
    }
  >
}

/**
 * 封装的 Mobx 工具方法, 负责状态同步
 */
@Shard(MobxUtilsMain.id)
export class MobxUtilsMain implements IAkariShardInitDispose {
  static id = 'mobx-utils-main'

  private readonly _disposables = new Set<Function>()
  protected readonly _registeredStates = new Map<string, RegisteredState>()

  /**
   * 为减少同步开销, 仅在被订阅时才会推送事件
   * uniqueId (namespace:stateId) -> webContentsIds
   */
  private readonly _rendererSubscription = new Map<string, Set<number>>()

  constructor(private readonly _ipc: AkariIpcMain) {}

  async onInit() {
    // 用于渲染进程获取初始定义的状态列表
    this._ipc.onCall(MobxUtilsMain.id, 'getStateProps', (_, namespace: string, stateId: string) => {
      const key = `${namespace}:${stateId}`
      if (!this._registeredStates.has(key)) {
        throw new Error(`State ${key} not found`)
      }

      const props = Array.from(this._registeredStates.get(key)!.props.entries()).map(
        ([path, config]) => ({
          path,
          config
        })
      )

      return props
    })

    // 用于渲染进程获取状态的属性值
    this._ipc.onCall(
      MobxUtilsMain.id,
      'getStatePropValue',
      (__, namespace: string, stateId: string, propPath: string) => {
        const key = `${namespace}:${stateId}`
        if (!this._registeredStates.has(key)) {
          throw new Error(`State ${key} not found`)
        }

        if (!this._registeredStates.get(key)!.props.has(propPath)) {
          throw new Error(`No registered prop path ${propPath} for ${key}`)
        }

        const item = this._registeredStates.get(key)!
        const _value = _.get(item.object, propPath)

        return isObservable(_value) ? toJS(_value) : _.get(item.object, propPath)
      }
    )

    this._ipc.onCall(
      MobxUtilsMain.id,
      'subscribeAndGetInitialState',
      (event, namespace: string, stateId: string) => {
        const key = `${namespace}:${stateId}`
        if (!this._registeredStates.has(key) || !this._rendererSubscription.has(key)) {
          throw new Error(`State ${key} not found`)
        }

        const subs = this._rendererSubscription.get(key)!
        if (!subs.has(event.sender.id)) {
          subs.add(event.sender.id)
          event.sender.on('destroyed', () => subs.delete(event.sender.id))
        }

        const config = this._registeredStates.get(key)!
        const props = Array.from(config.props.entries()).map(([path, config]) => ({
          path,
          config
        }))

        const statePlainObject = props.reduce(
          (acc, { path }) => {
            const _value = _.get(config.object, path)
            acc[path] = isObservable(_value) ? toJS(_value) : _value
            return acc
          },
          {} as Record<string, any>
        )

        return statePlainObject
      }
    )
  }

  async onDispose() {
    this._disposables.forEach((dispose) => dispose())
    this._disposables.clear()
    this._registeredStates.clear()
    this._rendererSubscription.clear()
  }

  /**
   * 在本地的 Mobx 状态对象上注册任意个属性, 当发生变化时, 推送一个事件
   * @param namespace 命名空间
   * @param stateId 状态 ID
   * @param obj Mobx 状态对象
   * @param propPath 属性路径
   */
  propSync<T extends object>(
    namespace: string,
    stateId: string,
    obj: T,
    propPath: Paths<T> | Paths<T>[]
  ) {
    const key = `${namespace}:${stateId}`

    if (!this._rendererSubscription.has(key)) {
      this._rendererSubscription.set(key, new Set())
    }

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

      config.props.set(path, {})

      const fn = reaction(
        () => _.get(obj, path),
        (newValue) => {
          this._rendererSubscription.get(key)?.forEach((wcId) => {
            this._ipc.sendEventToWebContents(
              wcId,
              MobxUtilsMain.id,
              `update-state-prop/${key}`,
              path,
              isObservable(newValue) ? toJS(newValue) : newValue,
              { action: 'update' }
            )
          })
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
}
