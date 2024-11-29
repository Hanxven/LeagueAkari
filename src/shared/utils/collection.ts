type Aggregator<T, ItemMapped = any, IterValue = any, FinalValue = any> = {
  prop: (item: T) => ItemMapped
  init: (items: T[]) => IterValue
  aggregate: (acc: IterValue, value: ItemMapped, items: T[]) => IterValue
  finalize?: (acc: IterValue, items: T[]) => FinalValue
}

type AggregatorOptions<T> = Record<string, Aggregator<T>>

type AggregatorsReturn<T, R extends AggregatorOptions<T>> = {
  [K in keyof R]: R[K]['finalize'] extends (acc: any, items: T[]) => infer V
    ? V
    : ReturnType<R[K]['init']>
}

export function aggregate<T, R extends AggregatorOptions<T>>(
  array: T[],
  aggregators: R
): AggregatorsReturn<T, R> {
  const aggregated: { [key: string]: any } = {}
  const results: { [key: string]: any } = {}

  for (const key in aggregators) {
    aggregated[key] = aggregators[key].init(array)
  }

  for (const item of array) {
    for (const key in aggregators) {
      const aggregator = aggregators[key]
      const value = aggregator.prop(item)
      aggregated[key] = aggregator.aggregate(aggregated[key], value, array)
    }
  }

  for (const key in aggregators) {
    const aggregator = aggregators[key]
    const finalize = aggregator.finalize
    results[key] = finalize ? finalize(aggregated[key], array) : aggregated[key]
  }

  return results as AggregatorsReturn<T, R>
}

export function simpleMin(prop: (item: any) => any): Aggregator<any> {
  return {
    prop,
    init: () => Number.MAX_SAFE_INTEGER,
    aggregate: (acc, value) => Math.min(acc, value)
  }
}

export function simpleMax(prop: (item: any) => any): Aggregator<any> {
  return {
    prop,
    init: () => Number.MIN_SAFE_INTEGER,
    aggregate: (acc, value) => Math.max(acc, value)
  }
}

export function simpleSum(prop: (item: any) => any): Aggregator<any> {
  return {
    prop,
    init: () => 0,
    aggregate: (acc, value) => acc + value
  }
}

export function simpleAvg(prop: (item: any) => any): Aggregator<any> {
  return {
    prop,
    init: () => ({ sum: 0, count: 0 }),
    aggregate: (acc, value) => ({ sum: acc.sum + value, count: acc.count + 1 }),
    finalize: (acc) => acc.sum / acc.count
  }
}
