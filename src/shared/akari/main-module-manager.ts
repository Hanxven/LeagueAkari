import { WebContents } from 'electron'

import { LeagueAkariModule } from './akari-module'
import { LeagueAkariIpc } from './main-ipc'

export class LeagueAkariModuleManager {
  private _modules = new Map<string, LeagueAkariModule>()

  private _subscribers = new Map<string, Set<WebContents>>()

  private _ipcMainDisposers = new Set<Function>()

  constructor() {}

  async register(module: LeagueAkariModule) {
    if (this._modules.has(module.id)) {
      throw new Error(`Module of Id '${module.id}' already registered`)
    }

    await module.onRegister(this)
    this._modules.set(module.id, module)
    this._subscribers.set(module.id, new Set())
  }

  async unregister(moduleId: string) {
    if (this._modules.has(moduleId)) {
      throw new Error(`Module of ID '${moduleId}' not found`)
    }

    await this._modules.get(moduleId)?.onUnregister()
    this._modules.delete(moduleId)
    this._subscribers.delete(moduleId)
  }

  setup() {
    const d1 = LeagueAkariIpc.onCall(
      'module-manager/renderer-register',
      (event, moduleId: string) => {
        const module = this._modules.get(moduleId)

        if (!module) {
          throw new Error(`No module of ID ${module}`)
        }

        event.sender.on('destroyed', () => {
          this._subscribers.get(module.id)?.delete(event.sender)
        })

        this._subscribers.get(module.id)?.add(event.sender)
      }
    )

    const d2 = LeagueAkariIpc.onCall(
      'module-manager/renderer-unregister',
      (event, moduleId: string) => {
        const module = this._modules.get(moduleId)

        if (!module) {
          throw new Error(`No module of ID ${module}`)
        }

        this._subscribers.get(module.id)?.delete(event.sender)
      }
    )

    const d3 = LeagueAkariIpc.onCall(
      'module-manager/call',
      (_, moduleId: string, methodName: string, ...args: any[]) => {
        return this._modules.get(moduleId)?.dispatchCall(methodName, ...args)
      }
    )

    this._ipcMainDisposers.add(d1)
    this._ipcMainDisposers.add(d2)
    this._ipcMainDisposers.add(d3)
  }

  unload() {
    this._ipcMainDisposers.forEach((fn) => fn())
    this._ipcMainDisposers.clear()
  }

  sendEvent(moduleId: string, eventName: string, ...args: any[]) {
    this._subscribers
      .get(moduleId)
      ?.forEach((w) =>
        LeagueAkariIpc.sendEvent(w, 'module-manager/event', moduleId, eventName, ...args)
      )
  }
}
