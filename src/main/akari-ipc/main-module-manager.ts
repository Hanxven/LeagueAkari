import { WebContents } from 'electron'

import { LeagueAkariModule } from './akari-module'
import { LeagueAkariIpc } from './main-ipc'

type ModuleInfo = {
  id: string
  module: LeagueAkariModule
  subscribers: Set<WebContents>
}

/**
 * 主进程进程模块中心，同时为渲染进程提供连接服务。主进程有且只有一个此实例
 */
export class LeagueAkariModuleManager {
  private _modules = new Map<string, ModuleInfo>()
  private _ipcMainDisposers = new Set<Function>()

  /**
   * 将一个模块注册到 manager 中
   */
  use(module: LeagueAkariModule) {
    if (this._modules.has(module.id)) {
      throw new Error(`Module of Id '${module.id}' was already added`)
    }

    module._setManager(this)
    this._modules.set(module.id, { id: module.id, module, subscribers: new Set() })
  }

  /**
   * 获取指定 ID 的模块，不存在则抛出异常
   * @param moduleId 模块 ID
   * @returns
   */
  getModule<T = LeagueAkariModule>(moduleId: string) {
    if (this._modules.has(moduleId)) {
      return this._modules.get(moduleId)!.module as T
    }

    throw new Error(`No module of ID ${moduleId}`)
  }

  hasModule(moduleId: string) {
    return this._modules.has(moduleId)
  }

  /**
   * 按照注册顺序依次启动模块
   */
  async setup() {
    const d1 = LeagueAkariIpc.onCall(
      'module-manager/renderer-register',
      (event, moduleId: string) => {
        const moduleInfo = this._modules.get(moduleId)

        if (!moduleInfo) {
          throw new Error(`No module of ID ${moduleId}`)
        }

        event.sender.on('destroyed', () => {
          this._modules.get(moduleId)?.subscribers.delete(event.sender)
        })

        this._modules.get(moduleId)?.subscribers.add(event.sender)
      }
    )

    const d2 = LeagueAkariIpc.onCall(
      'module-manager/renderer-unregister',
      (event, moduleId: string) => {
        const moduleInfo = this._modules.get(moduleId)

        if (!moduleInfo) {
          throw new Error(`No module of ID ${moduleId}`)
        }

        this._modules.get(moduleId)?.subscribers.delete(event.sender)
      }
    )

    const d3 = LeagueAkariIpc.onCall(
      'module-manager/call',
      (_, moduleId: string, methodName: string, ...args: any[]) => {
        return this._modules.get(moduleId)?.module.dispatchCall(methodName, ...args)
      }
    )

    this._ipcMainDisposers.add(d1)
    this._ipcMainDisposers.add(d2)
    this._ipcMainDisposers.add(d3)

    for (const [_, m] of this._modules) {
      await m.module.setup()
    }
  }

  async dismantle() {
    for (const [_, m] of this._modules) {
      await m.module.dismantle()
    }

    this._ipcMainDisposers.forEach((fn) => fn())
    this._ipcMainDisposers.clear()
  }

  sendEvent(moduleId: string, eventName: string, ...args: any[]) {
    this._modules
      .get(moduleId)
      ?.subscribers?.forEach((w) =>
        LeagueAkariIpc.sendEvent(w, 'module-manager/event', moduleId, eventName, ...args)
      )
  }
}
