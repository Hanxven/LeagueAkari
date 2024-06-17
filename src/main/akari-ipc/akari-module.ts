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
    if (!this._manager) {
      throw new Error('No Akari manager')
    }
    return this._manager
  }

  /**
   *
   * @param _moduleId 模块唯一标识
   * @param _rDeps 在提供服务时需要的其他模块
   */
  constructor(private _moduleId: string) {}

  /**
   * 参方法由 Manager 管理，不应手动调用
   */
  _setManager(manager: LeagueAkariModuleManager) {
    this._manager = manager
  }

  dispatchCall(methodName: string, ...args: any[]) {
    const fn = this._methodMap.get(methodName)
    if (!fn) {
      throw new Error(`No method of name ${methodName}`)
    }

    return fn(...args)
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
   * 启动服务
   */
  setup(): void | Promise<void> {
    if (!this._manager) {
      throw new Error('No Akari manager')
    }
  }

  /**
   * 停止服务
   */
  dismantle(): void | Promise<void> {
    this._methodMap.clear()
  }
}
