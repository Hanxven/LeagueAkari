import { LeagueAkariRendererModuleManager } from './renderer-module-manager'

type CallbackFn<T = any> = (data: T) => void

export class LeagueAkariRendererModule {
  private _eventMap = new Map<string, Set<CallbackFn>>()

  constructor(
    private _moduleId: string,
    private _manager: LeagueAkariRendererModuleManager | null = null
  ) {}

  get id() {
    return this._moduleId
  }

  /**
   * 参方法由 Manager 管理，不应手动调用
   */
  setManager(manager: LeagueAkariRendererModuleManager | null) {
    this._manager = manager
  }

  call<T = any>(methodName: string, ...args: any[]) {
    return this._manager?.call<T>(this._moduleId, methodName, ...args)
  }

  dispatchEvent<T = any>(eventName: string, data: T) {
    this._eventMap.get(eventName)?.forEach((fn) => fn(data))
  }

  onEvent<T = any>(eventName: string, fn: CallbackFn<T>) {
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
    this.setManager(manager)
  }

  /**
   * 在被 manager 取消注册时触发
   */
  onUnregister(): void | Promise<void> {
    this._eventMap.clear()
    this.setManager(null)
  }
}
