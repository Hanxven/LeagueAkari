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
  return array.reduce((accumulator, currentItem) => {
    const groupKey =
      typeof keyOrGetter === 'function' ? keyOrGetter(currentItem) : currentItem[keyOrGetter]

    if (!accumulator[groupKey]) {
      accumulator[groupKey] = []
    }

    accumulator[groupKey].push(currentItem)
    return accumulator
  }, {} as Record<string, T[]>)
}
