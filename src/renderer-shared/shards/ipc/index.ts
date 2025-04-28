import { ElectronAPI } from '@electron-toolkit/preload'
import { Dep, IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { IpcRendererEvent } from 'electron'
import { getCurrentScope, onScopeDispose } from 'vue'

import type { LoggerRenderer } from '../logger'

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export interface IpcMainSuccessDataType<T = any> {
  success: true
  data: T
}

export interface IpcMainErrorDataType {
  success: false
  isAxiosError?: boolean
  error: any
}

const LOGGER_SHARD_NAMESPACE = 'logger-renderer'

export type IpcMainDataType<T = any> = IpcMainSuccessDataType<T> | IpcMainErrorDataType

/**
 * 渲染进程 IPC 工具, 同时杂糅了一点 Vue 的支持
 */
@Shard(AkariIpcRenderer.id)
export class AkariIpcRenderer implements IAkariShardInitDispose {
  static id = 'akari-ipc-renderer'

  private _eventMap = new Map<string, Set<Function>>()
  private _cancelFn: (() => void) | null = null

  private _dispatchEvent(
    _event: IpcRendererEvent,
    namespace: string,
    eventName: string,
    ...args: any[]
  ) {
    const key = `${namespace}:${eventName}`
    const functions = this._eventMap.get(key)

    if (functions) {
      for (const fn of functions) {
        fn(...args)
      }
    }
  }

  async onInit() {
    this._cancelFn = window.electron.ipcRenderer.on('akari-event', this._dispatchEvent)
    await window.electron.ipcRenderer.invoke('akariRendererRegister', 'register')
  }

  async onDispose() {
    this._cancelFn?.()
    this._cancelFn = null
    this._eventMap.clear()
    await window.electron.ipcRenderer.invoke('akariRendererRegister', 'unregister')
  }

  /**
   * 调用一个函数, 若不存在会抛出异常
   * @param namespace
   * @param fnName
   * @param args
   * @returns
   */
  async call<T = any>(namespace: string, fnName: string, ...args: any[]) {
    const result: IpcMainDataType<T> = await window.electron.ipcRenderer.invoke(
      'akariCall',
      namespace,
      fnName,
      ...args
    )
    if (result.success) {
      return result.data as T
    } else {
      // axios 错误将不会触发特殊日志
      if (result.isAxiosError) {
        throw result.error
      }

      if (import.meta.env.DEV) {
        // for lazy loading
        const logger = this._shared.manager.getInstance(LOGGER_SHARD_NAMESPACE) as LoggerRenderer
        logger?.warn(`IpcCall:${namespace}`, fnName, args, result.error)
      }

      throw result.error
    }
  }

  /**
   * 期待一个事件
   * @param namespace
   * @param eventName
   * @param fn
   * @returns 取消订阅函数
   */
  onEvent(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    const key = `${namespace}:${eventName}`

    if (!this._eventMap.has(key)) {
      this._eventMap.set(key, new Set())
    }

    this._eventMap.get(key)!.add(fn)

    return () => {
      this._eventMap.get(key)!.delete(fn)
    }
  }

  /**
   * Vue 可自行解除订阅的事件
   */
  onEventVue(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    const disposeFn = this.onEvent(namespace, eventName, fn)
    getCurrentScope() && onScopeDispose(() => disposeFn())
    return disposeFn
  }

  /**
   * 取消订阅一个事件
   * @param namespace
   * @param eventName
   * @param fn
   */
  offEvent(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    const key = `${namespace}:${eventName}`
    const functions = this._eventMap.get(key)

    if (functions) {
      functions.delete(fn)
    }
  }

  constructor(@Dep(SharedGlobalShard) private readonly _shared: SharedGlobalShard) {
    this._dispatchEvent = this._dispatchEvent.bind(this)
  }
}
