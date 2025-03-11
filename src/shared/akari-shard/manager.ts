export type AkariDeps = Record<string, any>

export interface AkariShardConstructor<T = any> {
  new (deps: any | AkariDeps, config: object): T

  /**
   * 关于此模块的唯一 id
   */
  id: string

  /**
   * 在保持依赖顺序时, 越高的值加载越优先
   */
  priority?: number

  /**
   * 依赖的模块 ID 列表
   */
  dependencies?: (string | AkariShardConstructor)[]
}

export interface AkariSharedGlobalShard {
  readonly global: AkariSharedGlobal
  readonly manager: AkariManager
}

export interface AkariSharedGlobal {}

export const SHARED_GLOBAL_ID = '<akari-shared-global>'

export class AkariManager {
  private _registry: Map<
    string,
    {
      cls: AkariShardConstructor
      config: object
    }
  > = new Map()
  private _instances: Map<string, any> = new Map()

  private _isSetup = false
  private _initializationStack: string[] = []

  // @ts-ignore
  public readonly global: AkariSharedGlobal = {}

  private static INTERNAL_RUNNER_ID = '<akari-shard-runner-ヾ(≧▽≦*)o>'

  use(shard: AkariShardConstructor, config?: object) {
    if (!shard.id) {
      throw new Error('Shard id is required')
    }

    if (
      this._registry.has(shard.id) ||
      shard.id === AkariManager.INTERNAL_RUNNER_ID ||
      shard.id === SHARED_GLOBAL_ID
    ) {
      throw new Error(`Shard with id "${shard.id}" already exists`)
    }

    this._registry.set(shard.id, { cls: shard, config: config ?? {} })
  }

  /**
   * 启用所有注册的模块，进行依赖解析、实例化和生命周期钩子调用
   */
  async setup() {
    if (this._isSetup) {
      throw new Error('Already setup')
    }

    // 在 setup 阶段先注册全局 SharedGlobalShard（如果尚未注册）
    if (!this._registry.has(SHARED_GLOBAL_ID)) {
      const global = this.global
      const manager = this
      this._registry.set(SHARED_GLOBAL_ID, {
        cls: class __$SharedGlobalShard {
          static id = SHARED_GLOBAL_ID
          public readonly global: Record<string, any> = global
          public readonly manager: AkariManager = manager
        },
        config: {}
      })
    }

    const allDeps = [...this._registry.keys()]
    this._registry.set(AkariManager.INTERNAL_RUNNER_ID, {
      cls: class __$RootShard {
        static id = AkariManager.INTERNAL_RUNNER_ID
        static priority = -Infinity
        static dependencies = allDeps
      },
      config: {}
    })

    this._initializationStack = []
    this._inflate(AkariManager.INTERNAL_RUNNER_ID, new Set<string>(), this._initializationStack)

    for (const id of this._initializationStack) {
      const instance = this._instances.get(id)
      if (instance && instance.onInit) {
        await instance.onInit()
      }
    }

    this._isSetup = true

    for (const id of this._initializationStack) {
      const instance = this._instances.get(id)
      if (instance && instance.onFinish) {
        await instance.onFinish()
      }
    }

    this._initializationStack = []
  }

  async dispose() {
    if (!this._isSetup) {
      throw new Error('Not setup yet')
    }

    const reversed = this._initializationStack.toReversed()
    for (const id of reversed) {
      const instance = this._instances.get(id)
      if (instance && instance.onDispose) {
        instance.onDispose()
      }
    }

    this._instances.clear()
    this._isSetup = false
  }

  /**
   * 获取某个模块的实例
   * @param id 模块 ID
   * @returns 模块实例（可能为 undefined）
   */
  getInstance<T = any>(id: string) {
    return this._instances.get(id) as T | undefined
  }

  /**
   * 仅用于调试：返回模块初始化顺序
   * 仅在 setup 后有效
   */
  _getInitializationStack() {
    return this._initializationStack
  }

  private _inflate(id: string, visited: Set<string>, stack: string[]) {
    const c = this._registry.get(id)
    if (!c) {
      throw new Error(`Shard with id "${id}" does not exist`)
    }

    const dependencies = c.cls.dependencies
    const instances: AkariDeps = {}

    if (dependencies) {
      const sortedDependencies = dependencies.toSorted((a, b) => {
        const aDepId = typeof a === 'string' ? a : a.id
        const bDepId = typeof b === 'string' ? b : b.id
        const aPriority = this._registry.get(aDepId)?.cls?.priority ?? 0
        const bPriority = this._registry.get(bDepId)?.cls?.priority ?? 0
        return bPriority - aPriority
      })

      for (const dep of sortedDependencies) {
        const depId = typeof dep === 'string' ? dep : dep.id

        if (visited.has(depId)) {
          throw new Error(`Circular dependency detected: ${[...visited, dep].join(' -> ')}`)
        }

        if (instances[depId]) {
          throw new Error(`Duplicate dependency: ${dep} from [${dependencies.join(', ')}]`)
        }

        if (this._instances.has(depId)) {
          instances[depId] = this._instances.get(depId)!
        } else {
          visited.add(depId)
          instances[depId] = this._inflate(depId, visited, stack)
          visited.delete(depId)
        }
      }
    }

    stack.push(id)

    const instance = new c.cls(instances, c.config)
    this._instances.set(id, instance)

    return instance
  }
}
