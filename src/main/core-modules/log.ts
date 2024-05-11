import { onRendererCall } from '@main/utils/ipc'
import dayjs from 'dayjs'
import { app, shell } from 'electron'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Logger, format, transports, createLogger as winstonCreateLogger } from 'winston'

import { addQuitTask } from './app'

let winstonLogger: Logger | null = null

export function initLogger() {
  const appDir = join(app.getPath('exe'), '..')
  const logsDir = join(appDir, 'logs')

  try {
    const stats = statSync(logsDir)

    if (!stats.isDirectory()) {
      rmSync(logsDir, { recursive: true, force: true })
      mkdirSync(logsDir)
    }
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      mkdirSync(logsDir)
    } else {
      throw error
    }
  }

  winstonLogger = winstonCreateLogger({
    format: format.combine(
      format.timestamp(),
      format.printf(({ level, message, module, timestamp }) => {
        return `[${timestamp}] [${module}] [${level}] ${message}`
      })
    ),
    transports: [
      new transports.File({
        filename: `LeagueAkari_${dayjs().format('YYYYMMDD_HHmmssSSS')}.log`,
        dirname: logsDir,
        level: 'info'
      }),
      new transports.Console({
        level: 'warn'
      })
    ]
  })

  addQuitTask(
    () =>
      new Promise((resolve) => {
        if (winstonLogger) {
          winstonLogger.end(() => {
            resolve()
          })
        } else {
          resolve()
        }
      })
  )

  onRendererCall('logs/dir/open', () => {
    return shell.openPath(logsDir)
  })
}

export function createLogger(module: string = 'anonymous') {
  const getLogger = () => {
    if (!winstonLogger) {
      throw new Error('logger is not initialized')
    }
    return winstonLogger
  }

  return {
    info: (message: any) => getLogger().info({ module, message }),
    warn: (message: any) => getLogger().warn({ module, message }),
    error: (message: any) => getLogger().error({ module, message }),
    debug: (message: any) => getLogger().debug({ module, message })
  }
}
