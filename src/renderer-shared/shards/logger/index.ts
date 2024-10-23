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
    console.info(
      `%c[${dayjs().format('HH:mm:ss')}] [%c${namespace}%c]`,
      'color: blue; font-weight: bold;', // 时间部分样式
      'color: green; font-style: italic;', // namespace部分样式
      'color: inherit;',
      ...args
    )
    return this._ipc.call(MAIN_SHARD_NAMESPACE, namespace, 'info', this._objectsToString(...args))
  }

  warn(namespace: string, ...args: any[]) {
    console.warn(
      `%c[${dayjs().format('HH:mm:ss')}] [%c${namespace}%c]`,
      'color: blue; font-weight: bold;', // 时间部分样式
      'color: green; font-style: italic;', // namespace部分样式
      'color: inherit;',
      ...args
    )
    return this._ipc.call(MAIN_SHARD_NAMESPACE, namespace, 'warn', this._objectsToString(...args))
  }

  error(namespace: string, ...args: any[]) {
    console.error(
      `%c[${dayjs().format('HH:mm:ss')}] [%c${namespace}%c]`,
      'color: blue; font-weight: bold;',
      'color: green; font-style: italic;',
      'color: inherit;',
      ...args
    )
    return this._ipc.call(MAIN_SHARD_NAMESPACE, namespace, 'error', this._objectsToString(...args))
  }

  debug(namespace: string, ...args: any[]) {
    console.debug(
      `%c[${dayjs().format('HH:mm:ss')}] [%c${namespace}%c]`,
      'color: blue; font-weight: bold;',
      'color: green; font-style: italic;',
      'color: inherit;',
      ...args
    )
    return this._ipc.call(MAIN_SHARD_NAMESPACE, namespace, 'debug', this._objectsToString(...args))
  }
}
