import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface BaseConfig {
  disableHardwareAcceleration?: boolean
}

/**
 * 读取基础配置, 这些配置左右了应用级别的行为
 */
export function readBaseConfig() {
  const path = join(app.getPath('userData'), 'base-config.json')

  if (!existsSync(path)) {
    return null
  }

  try {
    const jsonFile = readFileSync(path, 'utf-8')
    const config = JSON.parse(jsonFile)

    if (typeof config !== 'object') {
      return null
    }

    return config as BaseConfig
  } catch (error) {
    return null
  }
}

/**
 * 重写这些配置
 */
export function writeBaseConfig(config: BaseConfig) {
  const path = join(app.getPath('userData'), 'base-config.json')
  const json = JSON.stringify(config)
  writeFileSync(path, json, 'utf-8')
}
