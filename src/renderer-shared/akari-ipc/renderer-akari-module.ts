import { LeagueAkariRendererModuleManager } from './renderer-module-manager'

type CallbackFn = (...args: any[]) => void

/**
 * League Akari 中，负责与主进程通信的模块
 */
export class LeagueAkariRendererModule {
  private _eventMap = new Map<string, Set<CallbackFn>>()
  private _manager: LeagueAkariRendererModuleManager | null = null

  constructor(
    private _moduleId: string,
    private _rendererOnly = false
  ) {}

  get id() {
    return this._moduleId
  }

  /**
   * 是否仅在渲染进程中运行，意味着不会与主进程通信，适用于纯渲染进程的功能
   */
  get rendererOnly() {
    return this._rendererOnly
  }

  /**
   * 参方法由 Manager 管理，不应手动调用
   */
  _setManager(manager: LeagueAkariRendererModuleManager | null) {
    this._manager = manager
  }

  get manager() {
    if (!this._manager) {
      throw new Error('No Akari manager')
    }
    return this._manager
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
   * 注册于 manager
   */
  setup(): void | Promise<void> {
    if (!this._manager) {
      throw new Error('No Akari manager')
    }
  }

  /**
   * 取消注册
   */
  dispose(): void | Promise<void> {
    this._eventMap.clear()
    this._setManager(null)
  }
}
