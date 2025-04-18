import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { isAxiosError } from 'axios'
import { IpcMainInvokeEvent, WebContents, ipcMain, webContents } from 'electron'

export class AkariIpcError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'AkariIpcError'
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

export type IpcMainDataType<T = any> = IpcMainSuccessDataType<T> | IpcMainErrorDataType

/**
 * League Akari 的 IPC 主进程实现
 */
@Shard(AkariIpcMain.id)
export class AkariIpcMain implements IAkariShardInitDispose {
  static id = 'akari-ipc-main'

  /**
   * 调用映射, 对应不同 namespace:key 的调用
   */
  private _callMap = new Map<string, Function>()
  private _renderers = new Set<number>()

  constructor() {
    this._handleRendererInvocation = this._handleRendererInvocation.bind(this)
    this._handleRendererRegister = this._handleRendererRegister.bind(this)
  }

  private _handleRendererInvocation(
    event: IpcMainInvokeEvent,
    namespace: string,
    fnName: string,
    ...args: any[]
  ) {
    const key = `${namespace}:${fnName}`
    const fn = this._callMap.get(key)

    if (!fn) {
      throw new Error(`No function "${fnName}" in namespace "${namespace}"`)
    }

    return AkariIpcMain._standardizeIpcData(() => fn(event, ...args))
  }

  /**
   * 处理来自渲染进程的事件订阅
   * @param event
   * @param action 可选值 register / unregister
   */
  private _handleRendererRegister(event: IpcMainInvokeEvent, action = 'register') {
    const id = event.sender.id

    if (action === 'register' && !this._renderers.has(id)) {
      this._renderers.add(id)
      event.sender.on('destroyed', () => this._renderers.delete(id))
      return { success: true }
    } else if (action === 'unregister' && this._renderers.has(id)) {
      this._renderers.delete(id)
      return { success: true }
    }

    return { success: false, error: { message: `invalid action "${action}"` } }
  }

  private static _standardizeIpcData(wrappedFn: Function) {
    try {
      const result = wrappedFn()
      if (result instanceof Promise) {
        return result
          .then((res) => ({ success: true, data: res }))
          .catch((error: any) => AkariIpcMain._handleError(error))
      } else {
        return { success: true, data: result }
      }
    } catch (error) {
      return AkariIpcMain._handleError(error)
    }
  }

  async onInit() {
    ipcMain.handle('akariCall', this._handleRendererInvocation)
    ipcMain.handle('akariRendererRegister', this._handleRendererRegister)
  }

  async onDispose() {
    ipcMain.removeHandler('akariCall')
    ipcMain.removeHandler('akariRendererRegister')
    this._callMap.clear()
  }

  /**
   * 发送到所有已注册的渲染进程, 事件名使用 kebab-case
   */
  sendEvent(namespace: string, eventName: string, ...args: any[]) {
    this._renderers.forEach((id) =>
      webContents.fromId(id)?.send('akari-event', namespace, eventName, ...args)
    )
  }

  sendEventToWebContents(w: number, namespace: string, eventName: string, ...args: any[]): void
  sendEventToWebContents(w: WebContents, namespace: string, eventName: string, ...args: any[]): void
  sendEventToWebContents(
    w: WebContents | number,
    namespace: string,
    eventName: string,
    ...args: any[]
  ) {
    const wc = typeof w === 'number' ? webContents.fromId(w) : w
    wc?.send('akari-event', namespace, eventName, ...args)
  }

  /**
   * 处理来自渲染进程的调用, 方法名使用 camelCase
   * @param cb
   */
  onCall(
    namespace: string,
    fnName: string,
    cb: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any
  ) {
    const key = `${namespace}:${fnName}`
    if (this._callMap.has(key)) {
      throw new Error(`Function "${fnName}" in namespace "${namespace}" already exists`)
    }

    this._callMap.set(key, cb)
  }

  /**
   * 处理一般错误和 axios 错误, 包含特例, 对业务错误网开一面
   * @param error
   * @returns
   */
  private static _handleError(error: any): IpcMainDataType {
    if (isAxiosError(error)) {
      const errorWithResponse = {
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data
            }
          : null,
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name
      }

      return {
        success: false,
        isAxiosError: true,
        error: errorWithResponse
      }
    } else if (error instanceof AkariIpcError) {
      return {
        success: false,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        }
      }
    } else if (error instanceof Error) {
      return {
        success: false,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }
    }

    return {
      success: false,
      error: { message: 'An error occurred' }
    }
  }

  /**
   * 获取已注册的渲染进程 ID 列表
   */
  getRegisteredRendererIds() {
    return Array.from(this._renderers)
  }
}
