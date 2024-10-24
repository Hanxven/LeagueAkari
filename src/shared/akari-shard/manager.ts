export type AkariDeps = Record<string, any>

interface AkariShardConstructor<T = any> {
  new (deps?: any | AkariDeps): T

  /**
   * 关于此模块的唯一 id
   */
  id: string

  /**
   * 依赖的模块 ID 列表
   */
  dependencies?: string[]
}

export interface AkariSharedGlobalShard {
  readonly global: AkariSharedGlobal
  readonly manager: AkariManager
}

export interface AkariSharedGlobal {}

export const SHARED_GLOBAL_ID = '<akari-shared-global>'

export class AkariManager {
  private _registry: Map<string, AkariShardConstructor> = new Map()
  private _instances: Map<string, any> = new Map()

  private _isSetup = false
  private _initializationStack: string[] = []

  // @ts-ignore
  public readonly global: AkariSharedGlobal = {}

  private static INTERNAL_RUNNER_ID = '<akari-shard-runner-ヾ(≧▽≦*)o>'

  /**
   * 将模块注册到管理器中, 将在 setup 时初始化
   * @param shard 类构造函数
   */
  use(...shards: AkariShardConstructor[]) {
    const global = this.global
    const manager = this
    shards.push(
      class __$SharedGlobalShard {
        static id = SHARED_GLOBAL_ID
        public readonly global: Record<string, any> = global
        public readonly manager: AkariManager = manager
      }
    )

    for (const shard of shards) {
      if (!shard.id) {
        throw new Error('Shard id is required')
      }

      if (this._registry.has(shard.id) || shard.id === AkariManager.INTERNAL_RUNNER_ID) {
        throw new Error(`Shard with id "${shard.id}" already exists`)
      }

      this._registry.set(shard.id, shard)
    }

    const allDeps = this._registry.keys()

    this._registry.set(
      AkariManager.INTERNAL_RUNNER_ID,
      class __$RootShard {
        static id = AkariManager.INTERNAL_RUNNER_ID
        static dependencies = [...allDeps].filter((dep) => dep !== AkariManager.INTERNAL_RUNNER_ID)
      }
    )
  }

  /**
   * 启用所有注册的模块, Akari, 启动!
   */
  async setup() {
    if (this._isSetup) {
      throw new Error('Already setup')
    }

    this._initializationStack = []
    this._resolve(AkariManager.INTERNAL_RUNNER_ID, new Set<string>(), this._initializationStack)

    for (const id of this._initializationStack) {
      const instance = this._instances.get(id)
      if (instance && instance.onInit) {
        await instance.onInit()
      }
    }

    this._isSetup = true
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
   * @returns 模块 ID 实例
   */
  getInstance(id: string) {
    if (!this._instances.has(id)) {
      throw new Error(`Shard with id "${id}" does not exist`)
    }

    return this._instances.get(id)!
  }

  private _resolve(id: string, visited: Set<string>, stack: string[]) {
    const cls = this._registry.get(id)
    if (!cls) {
      throw new Error(`Shard with id "${id}" does not exist`)
    }

    const dependencies = cls.dependencies
    const instances: AkariDeps = {}

    if (dependencies) {
      for (const dep of dependencies) {
        if (visited.has(dep)) {
          throw new Error(`Circular dependency detected: ${[...visited, dep].join(' -> ')}`)
        }

        if (instances[dep]) {
          throw new Error(`Duplicate dependency: ${dep} from [${dependencies.join(', ')}]`)
        }

        if (this._instances.has(dep)) {
          instances[dep] = this._instances.get(dep)!
        } else {
          visited.add(dep)
          instances[dep] = this._resolve(dep, visited, stack)
          visited.delete(dep)
        }
      }
    }

    stack.push(id)
    const instance = Object.keys(instances).length ? new cls(instances) : new cls()
    this._instances.set(id, instance)

    return instance
  }
}
