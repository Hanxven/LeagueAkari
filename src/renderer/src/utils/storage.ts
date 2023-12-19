/**
 * 一些不那么重要的设置选项，存在临时存储里
 */
export function getSetting<T = any>(key: string): T | undefined
export function getSetting<T = any>(key: string, defaultValue: T): T
export function getSetting<T = any>(key: string, defaultValue?: T) {
  const item = localStorage.getItem(key)

  if (item) {
    try {
      return JSON.parse(item)
    } catch {
      localStorage.removeItem(key)
      return defaultValue
    }
  }

  return defaultValue
}

export function setSetting<T = any>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}
