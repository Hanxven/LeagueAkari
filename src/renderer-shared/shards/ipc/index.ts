import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { IpcRendererEvent, ipcRenderer } from 'electron'

export class AkariIpcRenderer implements IAkariShardInitDispose {
  static id = 'akari-ipc-renderer'

  private _eventMap = new Map<string, Set<Function>>()

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
    ipcRenderer.on('akari-event', this._dispatchEvent)
    await ipcRenderer.invoke('akari-renderer-register', 'register')
  }

  async onDispose() {
    ipcRenderer.off('akari-event', this._dispatchEvent)
    await ipcRenderer.invoke('akari-renderer-register', 'unregister')
    this._eventMap.clear()
  }

  /**
   * 调用一个函数, 若不存在会抛出异常
   * @param namespace
   * @param fnName
   * @param args
   * @returns
   */
  call<T = any>(namespace: string, fnName: string, ...args: any[]) {
    return ipcRenderer.invoke('akari-call', namespace, fnName, ...args) as Promise<T>
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

  constructor() {}
}
