import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface BaseConfig {
  disableHardwareAcceleration?: boolean
  logLevel?: string
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

export function writeBaseConfig(config: Partial<BaseConfig>) {
  const path = join(app.getPath('userData'), 'base-config.json')

  const cfg = readBaseConfig()

  if (cfg) {
    writeFileSync(path, JSON.stringify({ ...cfg, ...config }), 'utf-8')
  } else {
    writeFileSync(path, JSON.stringify(config), 'utf-8')
  }
}
