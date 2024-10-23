import dayjs from 'dayjs'
import { app } from 'electron'
import { mkdirSync, rmSync, statSync } from 'fs'
import { join } from 'path'
import { createLogger, format, transports } from 'winston'

export function initAppLogger() {
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

  return createLogger({
    format: format.combine(
      format.timestamp(),
      format.printf(({ level, message, namespace, timestamp }) => {
        return `[${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss:SSS')}] [${namespace}] [${level}] ${message}`
      })
    ),
    transports: [
      new transports.File({
        filename: `LeagueAkari_${dayjs().format('YYYYMMDD_HHmmssSSS')}.log`,
        dirname: logsDir,
        level: 'info'
      }),
      new transports.Console({
        level: import.meta.env.DEV ? 'debug' : 'warn'
      })
    ]
  })
}
