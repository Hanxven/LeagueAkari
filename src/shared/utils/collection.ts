export function removeSubsets<T>(objects: T[], getter: (element: T) => (number | string)[]): T[] {
  // 将数组转换为集合
  const sets = objects.map((obj) => new Set(getter(obj)))

  return objects.filter((_object, index) => {
    const currentSet = sets[index]

    return !sets.some((otherSet, otherIndex) => {
      if (index === otherIndex) return false
      if (otherSet.size < currentSet.size) return false // 如果另一个集合更小，则当前集合不可能是其子集

      // 检查当前集合是否是另一个集合的子集
      return Array.from(currentSet).every((element) => otherSet.has(element))
    })
  })
}

export function groupBy<T extends Record<string, any>>(
  array: T[],
  keyOrGetter: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce(
    (accumulator, currentItem) => {
      const groupKey =
        typeof keyOrGetter === 'function' ? keyOrGetter(currentItem) : currentItem[keyOrGetter]

      if (!accumulator[groupKey]) {
        accumulator[groupKey] = []
      }

      accumulator[groupKey].push(currentItem)
      return accumulator
    },
    {} as Record<string, T[]>
  )
}

export class LruMap<K, V> {
  private _limit: number
  private _cache: Map<K, V>

  constructor(limit: number) {
    this._limit = limit
    this._cache = new Map<K, V>()
  }

  get(key: K): V | undefined {
    if (this._cache.has(key)) {
      const value = this._cache.get(key)
      this._cache.delete(key)
      this._cache.set(key, value!)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    if (this._cache.has(key)) {
      this._cache.delete(key)
    } else if (this._cache.size === this._limit) {
      this._removeOldestItem()
    }
    this._cache.set(key, value)
  }

  setLimit(newLimit: number): void {
    this._limit = newLimit
    while (this._cache.size > this._limit) {
      this._removeOldestItem()
    }
  }

  has(key: K): boolean {
    return this._cache.has(key)
  }

  private _removeOldestItem(): void {
    const firstKey = this._cache.keys().next().value
    this._cache.delete(firstKey)
  }
}
