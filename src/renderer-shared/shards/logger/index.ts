import { Dep, Shard } from '@shared/akari-shard'
import { formatError } from '@shared/utils/errors'
import dayjs from 'dayjs'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useLoggerStore } from './store'

export const MAIN_SHARD_NAMESPACE = 'logger-factory-main'

@Shard(LoggerRenderer.id)
export class LoggerRenderer {
  static id = 'logger-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer
  ) {}

  // same as main shard
  private _objectsToString(...args: any[]) {
    return args
      .map((arg) => {
        if (arg instanceof Error) {
          return formatError(arg)
        }

        if (typeof arg === 'undefined') {
          return 'undefined'
        }

        if (typeof arg === 'function') {
          return arg.toString()
        }

        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (error) {
            return arg.toString()
          }
        }

        return arg
      })
      .join(' ')
  }

  private _log(level: string, namespace: string, ...args: any[]) {
    const fn = {
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    }

    const scheme = this._getColorScheme()

    fn[level]?.(
      `%c[${dayjs().format('HH:mm:ss')}] %c[%c${namespace}%c] %c[${level}]`,
      scheme[level].timestamp,
      'color: inherit;',
      scheme[level].namespace,
      'color: inherit;',
      scheme[level].level,
      ...args
    )
  }

  info(namespace: string, ...args: any[]) {
    this._log('info', namespace, ...args)

    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'info',
      this._objectsToString(...args)
    )
  }

  warn(namespace: string, ...args: any[]) {
    this._log('warn', namespace, ...args)

    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'warn',
      this._objectsToString(...args)
    )
  }

  error(namespace: string, ...args: any[]) {
    this._log('error', namespace, ...args)

    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'error',
      this._objectsToString(...args)
    )
  }

  debug(namespace: string, ...args: any[]) {
    this._log('debug', namespace, ...args)

    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'debug',
      this._objectsToString(...args)
    )
  }

  infoRenderer(namespace: string, ...args: any[]) {
    this._log('info', namespace, ...args)
  }

  warnRenderer(namespace: string, ...args: any[]) {
    this._log('warn', namespace, ...args)
  }

  errorRenderer(namespace: string, ...args: any[]) {
    this._log('error', namespace, ...args)
  }

  debugRenderer(namespace: string, ...args: any[]) {
    this._log('debug', namespace, ...args)
  }

  private _getColorScheme() {
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    const darkColors = {
      debug: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #26a69a; font-weight: bold;'
      },
      info: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #42a5f5; font-weight: bold;'
      },
      warn: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #ffc107; font-weight: bold;'
      },
      error: {
        timestamp: 'color: #9aa0a6; font-weight: bold;',
        namespace: 'color: #b39ddb; font-weight: bold;',
        level: 'color: #ef5350; font-weight: bold;'
      }
    }

    const lightColors = {
      debug: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #00897b; font-weight: bold;'
      },
      info: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #1565c0; font-weight: bold;'
      },
      warn: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #fb8c00; font-weight: bold;'
      },
      error: {
        timestamp: 'color: #555; font-weight: bold;',
        namespace: 'color: #7e57c2; font-weight: bold;',
        level: 'color: #d32f2f; font-weight: bold;'
      }
    }

    return preferDark ? darkColors : lightColors
  }

  createLogger(namespace: string) {
    return {
      info: (...args: any[]) => this.info(namespace, ...args),
      warn: (...args: any[]) => this.warn(namespace, ...args),
      error: (...args: any[]) => this.error(namespace, ...args),
      debug: (...args: any[]) => this.debug(namespace, ...args)
    }
  }

  openLogsDir() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'openLogsDir')
  }

  setLogLevel(level: string) {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'setLogLevel', level)
  }

  async onInit() {
    const store = useLoggerStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }
}
