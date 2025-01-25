import { formatError } from '@shared/utils/errors'
import dayjs from 'dayjs'

import { AkariIpcRenderer } from '../ipc'

export const MAIN_SHARD_NAMESPACE = 'logger-factory-main'

export class LoggerRenderer {
  static id = 'logger-renderer'
  static dependencies = ['akari-ipc-renderer']

  private readonly _ipc: AkariIpcRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
  }

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

  info(namespace: string, ...args: any[]) {
    const { info } = this._getColorScheme()
    console.info(
      `%c[${dayjs().format('HH:mm:ss')}] %c[%c${namespace}%c] %c[info]`,
      info.timestamp,
      'color: inherit;',
      info.namespace,
      'color: inherit;',
      info.level,
      ...args
    )
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'info',
      this._objectsToString(...args)
    )
  }

  warn(namespace: string, ...args: any[]) {
    const { warn } = this._getColorScheme()
    console.warn(
      `%c[${dayjs().format('HH:mm:ss')}] %c[%c${namespace}%c] %c[warn]`,
      warn.timestamp,
      'color: inherit;',
      warn.namespace,
      'color: inherit;',
      warn.level,
      ...args
    )
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'warn',
      this._objectsToString(...args)
    )
  }

  error(namespace: string, ...args: any[]) {
    const { error } = this._getColorScheme()
    console.error(
      `%c[${dayjs().format('HH:mm:ss')}] %c[%c${namespace}%c] %c[error]`,
      error.timestamp,
      'color: inherit;',
      error.namespace,
      'color: inherit;',
      error.level,
      ...args
    )
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'error',
      this._objectsToString(...args)
    )
  }

  debug(namespace: string, ...args: any[]) {
    const { debug } = this._getColorScheme()
    console.debug(
      `%c[${dayjs().format('HH:mm:ss')}] %c[%c${namespace}%c] %c[debug]`,
      debug.timestamp,
      'color: inherit;',
      debug.namespace,
      'color: inherit;',
      debug.level,
      ...args
    )
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      'debug',
      this._objectsToString(...args)
    )
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
}
