import { LeagueAkariRendererModule } from './renderer-akari-module'
import { LeagueAkariRendererIpc } from './renderer-ipc'

/**
 * 渲染进程模块中心。每个渲染进程最多只有一个此实例
 */
export class LeagueAkariRendererModuleManager {
  private _modules = new Map<string, LeagueAkariRendererModule>()
  private _offHandle: Function | null = null

  use(module: LeagueAkariRendererModule) {
    if (this._modules.has(module.id)) {
      throw new Error(`Module of Id '${module.id}' was already added`)
    }

    module._setManager(this)
    this._modules.set(module.id, module)
  }

  getModule<T extends LeagueAkariRendererModule>(moduleId: string) {
    if (this._modules.has(moduleId)) {
      return this._modules.get(moduleId)! as T
    }

    throw new Error(`No module of ID ${moduleId}`)
  }

  hasModule(moduleId: string) {
    return this._modules.has(moduleId)
  }

  async setup() {
    this._offHandle = LeagueAkariRendererIpc.onEvent(
      'module-manager/event',
      (_, moduleId, eventName, ...args) => {
        this._modules.get(moduleId)?.dispatchEvent(eventName, ...args)
      }
    )

    for (const [_, m] of this._modules) {
      if (!m.rendererOnly) {
        try {
          await LeagueAkariRendererIpc.call('module-manager/renderer-register', m.id)
        } catch (error) {
          await LeagueAkariRendererIpc.call('module-manager/renderer-unregister', m.id)
          throw error
        }
      }
      await m.setup()
    }
  }

  dismantle() {
    this._offHandle?.()
  }

  call<T = any>(moduleId: string, methodName: string, ...args: any[]) {
    return LeagueAkariRendererIpc.call<T>('module-manager/call', moduleId, methodName, ...args)
  }
}
