export type ConstructorDeps = Record<string, any>

export interface AkariModuleConstructor<T = any> {
  new (deps: ConstructorDeps): T

  /**
   * 依赖的模块 ID 列表
   */
  dependencies?: string[]
}

export class AkariManager {
  private _registry: Map<string, AkariModuleConstructor> = new Map()
  private _instances: Map<string, any> = new Map()

  static INTERNAL_ROOT_ID = '<akari-root-ヾ(≧▽≦*)o>'

  /**
   * 将一个模块注册到管理器中, 将在 setup 时初始化
   * @param id 唯一 ID
   * @param module 类构造函数
   */
  use(id: string, module: AkariModuleConstructor) {
    if (this._registry.has(id)) {
      throw new Error(`Module with id "${id}" already exists`)
    }

    this._registry.set(id, module)

    const allDeps = this._registry.keys()
    const cls = class {
      static dependencies = [...allDeps].filter(
        (dep) => dep !== AkariManager.INTERNAL_ROOT_ID
      )
    }

    this._registry.set(AkariManager.INTERNAL_ROOT_ID, cls)
  }

  /**
   * 启用所有注册的模块, Akari, 启动!
   * @returns 返回一个函数, 用于清理所有模块
   */
  async setup() {
    const stack: string[] = []
    this._resolve(AkariManager.INTERNAL_ROOT_ID, new Set<string>(), stack)

    for (const id of stack) {
      const instance = this._instances.get(id)
      if (instance && instance.onInit) {
        await instance.onInit()
      }
    }

    return () => {
      const reversed = stack.toReversed()
      for (const id of reversed) {
        const instance = this._instances.get(id)
        if (instance && instance.onDispose) {
          instance.onDispose()
        }
      }
    }
  }

  private _resolve(id: string, visited: Set<string>, stack: string[]) {
    const cls = this._registry.get(id)
    if (!cls) {
      throw new Error(`Module with id "${id}" does not exist`)
    }

    const dependencies = cls.dependencies
    const instances: ConstructorDeps = {}

    if (dependencies) {
      for (const dep of dependencies) {
        if (visited.has(dep)) {
          throw new Error(
            `Circular dependency detected: ${[...visited, dep].join(' -> ')}`
          )
        }

        if (instances[dep]) {
          throw new Error(
            `Duplicate dependency: ${dep} from [${dependencies.join(', ')}]`
          )
        }

        if (this._instances.has(dep)) {
          instances[dep] = this._instances.get(dep)!
        } else {
          visited.add(dep)
          stack.push(dep)
          instances[dep] = this._resolve(dep, visited, stack)
          visited.delete(dep)
        }
      }
    }

    const instance = new cls(instances)

    this._instances.set(id, instance)

    return instance
  }
}
