import { ElectronAPI } from '@electron-toolkit/preload'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { IpcRenderer, IpcRendererEvent } from 'electron'

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

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
  call<T = any>(namespace: string, fnName: string, ...args: any[]) {
    return window.electron.ipcRenderer.invoke('akariCall', namespace, fnName, ...args) as Promise<T>
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

  constructor() {
    this._dispatchEvent = this._dispatchEvent.bind(this)
  }
}
