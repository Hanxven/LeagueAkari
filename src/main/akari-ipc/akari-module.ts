import { LeagueAkariModuleManager } from './main-module-manager'

type CallbackFn<T = any> = (...args: any[]) => Promise<T> | T

/**
 * League Akari 中，基本的功能单元
 */
export class LeagueAkariModule {
  private _methodMap = new Map<string, CallbackFn>()
  private _manager: LeagueAkariModuleManager | null = null

  /**
   * 模块的唯一全局唯一标识，渲染进程和主进程中的模块可以通过此标识找到对应的模块。
   */
  get id() {
    return this._moduleId
  }

  /**
   * 获取模块管理器
   */
  get manager() {
    if (!this._manager) {
      throw new Error('No Akari manager')
    }
    return this._manager
  }

  /**
   * @param _moduleId 模块唯一标识
   */
  constructor(private _moduleId: string) {}

  /**
   * 此方法由 Manager 管理，不应手动调用
   */
  _setManager(manager: LeagueAkariModuleManager) {
    this._manager = manager
  }

  /**
   * 将渲染进程的函数调用转发到本模块内的注册 IPC 方法
   * @param methodName 函数名
   * @param args 函数参数
   * @returns 函数返回值
   */
  dispatchCall(methodName: string, ...args: any[]) {
    const fn = this._methodMap.get(methodName)
    if (!fn) {
      throw new Error(`No method of name ${methodName}`)
    }

    return fn(...args)
  }

  /**
   * 向渲染进程发送事件
   * @param eventName 事件名
   * @param args 事件参数
   */
  sendEvent(eventName: string, ...args: any[]) {
    this._manager?.sendEvent(this._moduleId, eventName, ...args)
  }

  /**
   * 注册 IPC 方法
   * @param methodName 方法名
   * @param fn 方法
   * @returns
   */
  onCall<T = any>(methodName: string, fn: CallbackFn<T>) {
    if (this._methodMap.has(methodName)) {
      throw new Error(`Call handler for resource ${methodName} already exists`)
    }

    this._methodMap.set(methodName, fn)

    return () => {
      return this._methodMap.delete(methodName)
    }
  }

  /**
   * 启动此模块，进行若干初始化操作。
   */
  setup(): void | Promise<void> {
    if (!this._manager) {
      throw new Error('No Akari manager')
    }
  }

  /**
   * 停止服务
   */
  dispose(): void | Promise<void> {
    this._methodMap.clear()
  }
}
