import { LeagueAkariModuleManager } from './main-module-manager'

type CallbackFn<T = any> = (...args: any[]) => Promise<T> | T

/**
 * League Akari 中，基本的功能单元
 */
export class LeagueAkariModule {
  private _methodMap = new Map<string, CallbackFn>()
  private _manager: LeagueAkariModuleManager | null = null

  get id() {
    return this._moduleId
  }

  get manager() {
    return this._manager
  }

  constructor(private _moduleId: string) {}

  /**
   * 参方法由 Manager 管理，不应手动调用
   */
  setManager(manager: LeagueAkariModuleManager | null) {
    this._manager = manager
  }

  dispatchCall(methodName: string, ...args: any[]) {
    return this._methodMap.get(methodName)?.(...args)
  }

  sendEvent(eventName: string, ...args: any[]) {
    this._manager?.sendEvent(this._moduleId, eventName, ...args)
  }

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
   * 在被 manager 注册时触发
   */
  onRegister(manager: LeagueAkariModuleManager): void | Promise<void> {
    this.setManager(manager)
  }

  /**
   * 在被 manager 取消注册时触发
   */
  onUnregister(): void | Promise<void> {
    this._methodMap.clear()
    this.setManager(null)
  }
}
