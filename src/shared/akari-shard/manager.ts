import { Constructor, Shard } from './decorators'
import { AkariSharedGlobal } from './interface'

export class AkariManager {
  private _registry: Map<
    string | symbol,
    {
      ctor: Constructor
      config?: object
    }
  > = new Map()
  private _instances: Map<string | symbol, any> = new Map()

  private _isSetup = false
  private _initializationOrder: string[] = []

  // @ts-ignore
  public readonly global: AkariSharedGlobal = {}

  public static readonly SHARED_GLOBAL_ID = Symbol('<akari-shared-global>')
  public static readonly INTERNAL_RUNNER_ID = Symbol('<akari-shard-runner~(∠・ω<)⌒★>')

  use(shard: Constructor, config?: object) {
    const id = this._getMetadata(shard).id

    if (this._registry.has(id)) {
      throw new Error(`Shard with id "${id.toString()}" already exists`)
    }

    this._registry.set(id, { ctor: shard, config })
  }

  /**
   * 启用所有注册的模块，进行依赖解析、实例化和生命周期钩子调用
   */
  async setup() {
    if (this._isSetup) {
      throw new Error('Already setup')
    }

    if (!this._registry.has(AkariManager.SHARED_GLOBAL_ID)) {
      this._registry.set(AkariManager.SHARED_GLOBAL_ID, {
        ctor: SharedGlobalShard
      })
    }

    this._registry.set(AkariManager.INTERNAL_RUNNER_ID, {
      ctor: __InternalRunner
    })

    this._instances.set(AkariManager.SHARED_GLOBAL_ID, new SharedGlobalShard(this))

    this._initializationOrder = []
    this._initializeShard(
      AkariManager.INTERNAL_RUNNER_ID,
      new Set<string>(),
      this._initializationOrder
    )

    for (const id of this._initializationOrder) {
      const instance = this._instances.get(id)
      if (instance && instance.onInit) {
        await instance.onInit()
      }
    }

    for (const id of this._initializationOrder) {
      const instance = this._instances.get(id)
      if (instance && instance.onFinish) {
        await instance.onFinish()
      }
    }

    this._isSetup = true
  }

  async dispose() {
    if (!this._isSetup) {
      throw new Error('Not setup yet')
    }

    const reversed = this._initializationOrder.toReversed()
    for (const id of reversed) {
      const instance = this._instances.get(id)
      if (instance && instance.onDispose) {
        instance.onDispose()
      }
    }

    this._instances.clear()
    this._initializationOrder = []
    this._isSetup = false
  }

  /**
   * 获取某个模块的实例
   * @param id 模块 ID 或构造函数
   * @returns 模块实例（可能为 undefined）
   */
  getInstance(id: string | symbol): any | undefined
  getInstance<T extends new (...args: any[]) => any>(ctor: T): InstanceType<T> | undefined
  getInstance(idOrCtor: string | symbol | Constructor) {
    if (typeof idOrCtor === 'string' || typeof idOrCtor === 'symbol') {
      return this._instances.get(idOrCtor)
    }

    return this.getInstance(this._getMetadata(idOrCtor).id)
  }

  /**
   * 仅用于调试：返回模块初始化顺序
   * 仅在 setup 后有效
   */
  _getInitializationOrder() {
    return this._initializationOrder
  }

  private _initializeShard(
    id: string | symbol,
    visited: Set<string | symbol>,
    order: (string | symbol)[]
  ) {
    const c = this._registry.get(id)
    if (!c) {
      throw new Error(`Shard not registered: "${id.toString()}"`)
    }

    const metadata = this._getMetadata(c.ctor)
    const ctorParameters = this._getCtorParams(c.ctor)

    const maxDepOverridesIndex = metadata.depOverrides
      ? Math.max(...Array.from(metadata.depOverrides.keys()))
      : -1
    const configParamIndex = metadata.configParamIndex ?? -1
    const paramsLength = Math.max(
      maxDepOverridesIndex + 1,
      configParamIndex + 1,
      ctorParameters.length
    )

    const extended = [...ctorParameters, ...Array(paramsLength - ctorParameters.length).fill(null)]
    const mappedDepIds = extended.map((p, index) => {
      if (metadata.configParamIndex === index) {
        return null
      }

      if (metadata.depOverrides && metadata.depOverrides.has(index)) {
        const dep = metadata.depOverrides.get(index)!
        return typeof dep === 'string' ? dep : this._getMetadata(dep).id
      }

      return this._isShard(p) ? this._getMetadata(p).id : null
    })

    const depIds = mappedDepIds.filter((p) => p !== null)
    if (depIds.some((depId) => !this._registry.has(depId))) {
      throw new Error(
        `Shard not registered: ${depIds.filter((depId) => !this._registry.has(depId)).join(', ')}`
      )
    }

    const instances = new Map<string | symbol, any>()

    if (depIds.length) {
      const sortedDepIds = depIds.toSorted((a, b) => {
        const aM = this._getMetadata(this._registry.get(a)!.ctor)
        const bM = this._getMetadata(this._registry.get(b)!.ctor)
        return bM.priority - aM.priority
      })

      for (const depId of sortedDepIds) {
        if (visited.has(depId)) {
          throw new Error(`Circular dependency detected: ${[...visited, depId].join(' -> ')}`)
        }

        if (this._instances.has(depId)) {
          instances.set(depId, this._instances.get(depId)!)
        } else {
          visited.add(depId)
          instances.set(depId, this._initializeShard(depId, visited, order))
          visited.delete(depId)
        }
      }
    }

    order.push(id)

    const shardParams = mappedDepIds.map((p) => (p ? instances.get(p) : undefined))

    if (metadata.configParamIndex !== undefined) {
      shardParams[metadata.configParamIndex] = c.config
    }

    const instance = new c.ctor(...shardParams)
    this._instances.set(id, instance)

    return instance
  }

  private _getMetadata(target: Constructor): {
    id: string | symbol
    priority: number
    configParamIndex?: number
    depOverrides?: Map<number, string | Constructor>
  } {
    const id = Reflect.getMetadata('akari:id', target)
    const priority = Reflect.getMetadata('akari:priority', target)
    const configParamIndex = Reflect.getMetadata('akari:configParamIndex', target)
    const depOverrides = Reflect.getMetadata('akari:depOverrides', target) as
      | Map<number, string | Constructor>
      | undefined

    if (!id || priority === undefined) {
      throw new Error(`Shard metadata not found on ${target.name}`)
    }

    return { id, priority, configParamIndex, depOverrides }
  }

  private _isShard(target: any): target is Constructor {
    if (typeof target !== 'function' || !target.prototype) {
      return false
    }

    return Reflect.hasMetadata('akari:id', target)
  }

  private _getCtorParams(target: Constructor): Function[] {
    if (this._getMetadata(target).id === AkariManager.INTERNAL_RUNNER_ID) {
      return Array.from(this._registry.values())
        .map((r) => r.ctor)
        .filter((r) => r !== target)
    }

    return Reflect.getMetadata('design:paramtypes', target) || []
  }
}

/**
 * should not be instantiated directly, managed by AkariManager
 */
@Shard(AkariManager.SHARED_GLOBAL_ID, -Infinity)
export class SharedGlobalShard {
  /** an alias for AkariManager.global */
  public global: AkariSharedGlobal

  constructor(public manager: AkariManager) {
    this.global = manager.global
  }
}

@Shard(AkariManager.INTERNAL_RUNNER_ID, -Infinity)
class __InternalRunner {}
