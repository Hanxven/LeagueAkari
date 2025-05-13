import dayjs from 'dayjs'
import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { createLogger, format, transports } from 'winston'

const STYLES = {
  reset: '\x1b[0m',

  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m',

  // 前景色
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // 背景色
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bgBrightBlack: '\x1b[100m',
  bgBrightRed: '\x1b[101m',
  bgBrightGreen: '\x1b[102m',
  bgBrightYellow: '\x1b[103m',
  bgBrightBlue: '\x1b[104m',
  bgBrightMagenta: '\x1b[105m',
  bgBrightCyan: '\x1b[106m',
  bgBrightWhite: '\x1b[107m'
}

const LEVEL_COLORS = {
  info: STYLES.green,
  debug: STYLES.cyan,
  warn: STYLES.yellow,
  error: STYLES.red
}

export function initAppLogger(level: string = 'info') {
  const appDir = path.join(app.getPath('exe'), '..')
  const logsDir = path.join(appDir, 'logs')

  try {
    const stats = fs.statSync(logsDir)

    if (!stats.isDirectory()) {
      fs.rmSync(logsDir, { recursive: true, force: true })
      fs.mkdirSync(logsDir)
    }
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      fs.mkdirSync(logsDir)
    } else {
      throw error
    }
  }

  const filename = `LA_${dayjs().format('YYYYMMDD_HHmmssSSS')}.log`

  const fileTransport = new transports.File({
    filename,
    dirname: logsDir,
    level,
    maxsize: 1024 * 1024 * 128, // 128MB
    format: format.combine(
      format.timestamp(),
      format.printf(({ level, message, namespace, timestamp }) => {
        return `[${dayjs(timestamp as number).format('YYYY-MM-DD HH:mm:ss:SSS')}] [${namespace}] [${level}] ${message}`
      })
    )
  })

  const consoleTransport = new transports.Console({
    level: import.meta.env.DEV ? 'debug' : level,
    format: format.combine(
      format.timestamp(),
      format.printf(({ level, message, namespace, timestamp }) => {
        const timestampColored = `${STYLES.white}[${dayjs(timestamp as any).format('YYYY-MM-DD HH:mm:ss:SSS')}]${STYLES.reset}`
        const namespaceColored = `${STYLES.brightBlue}${STYLES.bold}[${namespace}]${STYLES.reset}`
        const levelColor = LEVEL_COLORS[level] || STYLES.reset
        const levelColored = `${levelColor}[${level}]${STYLES.reset}`

        return `${timestampColored} ${namespaceColored} ${levelColored} ${message}`
      })
    )
  })

  const setLevel = (level: string) => {
    fileTransport.level = level
    consoleTransport.level = import.meta.env.DEV ? 'debug' : level
  }

  const logger = createLogger({
    transports: [fileTransport, consoleTransport]
  })

  return {
    logger,
    logsDir,
    filename,
    setLevel,
    getLevel: () => fileTransport.level || level
  }
}
