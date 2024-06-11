import { LeagueAkariRendererModuleManager } from './renderer-module-manager'

type CallbackFn = (...args: any[]) => void

/**
 * League Akari 中，负责与主进程通信的模块
 */
export class LeagueAkariRendererModule {
  private _eventMap = new Map<string, Set<CallbackFn>>()
  private _manager: LeagueAkariRendererModuleManager | null = null

  constructor(private _moduleId: string) {}

  get id() {
    return this._moduleId
  }

  /**
   * 参方法由 Manager 管理，不应手动调用
   */
  _setManager(manager: LeagueAkariRendererModuleManager | null) {
    this._manager = manager
  }

  call<T = any>(methodName: string, ...args: any[]) {
    if (!this._manager) {
      throw new Error('Akari Manager is not ready')
    }

    return this._manager.call<T>(this._moduleId, methodName, ...args)
  }

  dispatchEvent(eventName: string, ...args: any[]) {
    this._eventMap.get(eventName)?.forEach((fn) => fn(...args))
  }

  onEvent(eventName: string, fn: CallbackFn) {
    if (!this._eventMap.has(eventName)) {
      this._eventMap.set(eventName, new Set())
    }

    this._eventMap.get(eventName)!.add(fn)

    return () => {
      return this._eventMap.get(eventName)?.delete(fn)
    }
  }

  /**
   * 在被 manager 注册时触发
   */
  onRegister(manager: LeagueAkariRendererModuleManager): void | Promise<void> {
    this._setManager(manager)
  }

  /**
   * 在被 manager 取消注册时触发
   */
  onUnregister(): void | Promise<void> {
    this._eventMap.clear()
    this._setManager(null)
  }
}
