import { dataSource } from '@main/db'
import { Setting } from '@main/db/entities/Settings'

export async function getSetting<T = any>(key: string, defaultValue: T) {
  const v = await dataSource.manager.findOneBy(Setting, { key })
  if (!v) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`cannot find setting of key ${key}`)
  }

  return v.value as T
}

export async function setSetting(key: string, value: any) {
  if (!key || value === undefined) {
    throw new Error('key or value cannot be empty')
  }

  await dataSource.manager.save(Setting.create(key, value))
}

export async function removeSetting(key: string) {
  if (!key) {
    throw new Error('key is required')
  }

  await dataSource.manager.delete(Setting, { key })
}
