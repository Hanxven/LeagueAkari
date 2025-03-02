import type { IgnoreMouseEventsOptions } from 'electron'

import { WindowManagerRendererContext } from '.'

export interface AkariBaseWindowRendererBasicState {
  status: 'normal' | 'maximized' | 'minimized'

  focus: 'focused' | 'blurred'

  ready: boolean

  show: boolean

  bounds: Electron.Rectangle | null
}

export interface AkariBaseWindowRendererBasicSetting {
  pinned: boolean
  opacity: number
}

export class BaseAkariWindowRenderer<
  TState extends AkariBaseWindowRendererBasicState,
  TSettings extends AkariBaseWindowRendererBasicSetting
> {
  constructor(
    protected _context: WindowManagerRendererContext,
    protected _mainShardNamespace: string,
    public stateGetter: () => TState,
    public settingsGetter: () => TSettings
  ) {}

  setSize(width: number, height: number) {
    return this._context.ipc.call(this._mainShardNamespace, 'setSize', width, height)
  }

  getSize(): Promise<[number, number]> {
    return this._context.ipc.call(this._mainShardNamespace, 'getSize')
  }

  minimize() {
    return this._context.ipc.call(this._mainShardNamespace, 'minimize')
  }

  maximize() {
    return this._context.ipc.call(this._mainShardNamespace, 'maximize')
  }

  unmaximize() {
    return this._context.ipc.call(this._mainShardNamespace, 'unmaximize')
  }

  restore() {
    return this._context.ipc.call(this._mainShardNamespace, 'restore')
  }

  close() {
    return this._context.ipc.call(this._mainShardNamespace, 'close')
  }

  toggleDevtools() {
    return this._context.ipc.call(this._mainShardNamespace, 'toggleDevtools')
  }

  show(inactive = false) {
    return this._context.ipc.call(this._mainShardNamespace, 'show', inactive)
  }

  hide() {
    return this._context.ipc.call(this._mainShardNamespace, 'hide')
  }

  setTitle(title: string) {
    return this._context.ipc.call(this._mainShardNamespace, 'setTitle', title)
  }

  resetPosition() {
    return this._context.ipc.call(this._mainShardNamespace, 'resetPosition')
  }

  setOpacity(value: number) {
    return this._context.setting.set(this._mainShardNamespace, 'opacity', value)
  }

  setPinned(value: boolean) {
    return this._context.setting.set(this._mainShardNamespace, 'pinned', value)
  }

  setIgnoreMouseEvents(value: boolean, options?: IgnoreMouseEventsOptions) {
    return this._context.ipc.call(this._mainShardNamespace, 'setIgnoreMouseEvents', value, options)
  }

  async onInit() {
    const state = this.stateGetter()
    const settings = this.settingsGetter()

    await this._context.pm.sync(this._mainShardNamespace, 'state', state)
    await this._context.pm.sync(this._mainShardNamespace, 'settings', settings)
  }
}
