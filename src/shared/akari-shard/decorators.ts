export type Constructor = new (...args: any[]) => any

export type DepType = string | Constructor

/**
 * 标记一个 shard 模块
 * @param id 模块 ID
 * @param priority 优先级, 高值具有更高的优先级
 * @returns
 */
export function Shard(id: string | symbol, priority = -Infinity): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('akari:id', id, target)
    Reflect.defineMetadata('akari:priority', priority, target)
  }
}

/**
 * 标记配置项
 * @returns
 */
export function Config(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey !== undefined) {
      throw new Error(`Config decorator can only be used on constructor parameters`)
    }

    if (Reflect.hasMetadata('akari:depOverrides', target)) {
      const depOverrides = Reflect.getMetadata('akari:depOverrides', target) as Map<
        number,
        string | Constructor
      >

      if (depOverrides.has(parameterIndex)) {
        throw new Error(`Config decorator cannot be used on dep parameter`)
      }
    }

    if (Reflect.hasMetadata('akari:configParamIndex', target)) {
      throw new Error(`Config decorator can appear only once on a constructor`)
    }

    Reflect.defineMetadata('akari:configParamIndex', parameterIndex, target)
  }
}

/**
 * 标记一个构造函数参数
 *
 * **在不支持 emitDecoratorMetadata 的环境中 (e.g. esbuild), 需要手动标记**
 * @param dep 依赖的模块 ID 或构造函数
 * @returns
 */
export function Dep(dep: string | Constructor): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey !== undefined) {
      throw new Error(`Dep decorator can only be used on constructor parameters`)
    }

    if (Reflect.hasMetadata('akari:configParamIndex', target)) {
      const configParamIndex = Reflect.getMetadata('akari:configParamIndex', target) as number

      if (parameterIndex === configParamIndex) {
        throw new Error(`Dep decorator cannot be used on config parameter`)
      }
    }

    if (!Reflect.hasMetadata('akari:depOverrides', target)) {
      Reflect.defineMetadata('akari:depOverrides', new Map(), target)
    }

    const depOverrides = Reflect.getMetadata('akari:depOverrides', target) as Map<
      number,
      string | Constructor
    >

    if (depOverrides.has(parameterIndex)) {
      throw new Error(`Dep decorator can appear only once on a constructor parameter`)
    }

    depOverrides.set(parameterIndex, dep)
  }
}
