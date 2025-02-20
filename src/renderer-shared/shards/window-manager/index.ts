import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  useAuxWindowStore,
  useMainWindowStore,
  useOpggWindowStore,
  useWindowManagerStore
} from './store'

const MAIN_SHARD_NAMESPACE = 'window-manager-main'
const MAIN_SHARD_NAMESPACE_MAIN_WINDOW = 'window-manager-main/main-window'
const MAIN_SHARD_NAMESPACE_AUX_WINDOW = 'window-manager-main/aux-window'
const MAIN_SHARD_NAMESPACE_OPGG_WINDOW = 'window-manager-main/opgg-window'

export interface WindowManagerRendererContext {
  ipc: AkariIpcRenderer
  setting: SettingUtilsRenderer
  pm: PiniaMobxUtilsRenderer
}

class AkariMainWindow {
  constructor(private _context: WindowManagerRendererContext) {}

  async onInit() {
    const mwStore = useMainWindowStore()
    await this._context.pm.sync(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'state', mwStore)
    await this._context.pm.sync(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'settings', mwStore.settings)
  }

  onAskClose(fn: (...args: any[]) => void) {
    return this._context.ipc.onEventVue(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'close-asking', fn)
  }

  maximize() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'maximize')
  }

  minimize() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'minimize')
  }

  restore() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'restore')
  }

  close(strategy?: string) {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'closeMainWindow', strategy)
  }

  toggleDevtools() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'toggleDevtools')
  }

  hide() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'hide')
  }

  show() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'show')
  }

  unmaximize() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'unmaximize')
  }

  setCloseAction(value: string) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'closeAction', value)
  }
}

/**
 * 辅助窗口逻辑封装
 */
class AkariAuxWindow {
  constructor(private _context: WindowManagerRendererContext) {}

  async onInit() {
    const awStore = useAuxWindowStore()
    await this._context.pm.sync(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'state', awStore)
    await this._context.pm.sync(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'settings', awStore.settings)
  }

  minimize() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'minimize')
  }

  restore() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'restore')
  }

  hide() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'hide')
  }

  show() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'show')
  }

  resetPosition() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'resetPosition')
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'enabled', value)
  }

  setOpacity(value: number) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'opacity', value)
  }

  setPinned(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'pinned', value)
  }

  setShowSkinSelector(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'showSkinSelector', value)
  }
}

class AkariOpggWindow {
  constructor(private _context: WindowManagerRendererContext) {}

  async onInit() {
    const awStore = useOpggWindowStore()
    await this._context.pm.sync(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'state', awStore)
    await this._context.pm.sync(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'settings', awStore.settings)
  }

  minimize() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'minimize')
  }

  restore() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'restore')
  }

  hide() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'hide')
  }

  show() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'show')
  }

  resetPosition() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'resetPosition')
  }

  repositionToAlignLeagueClientUx() {
    return this._context.ipc.call(
      MAIN_SHARD_NAMESPACE_OPGG_WINDOW,
      'repositionToAlignLeagueClientUx'
    )
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'enabled', value)
  }

  setOpacity(value: number) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'opacity', value)
  }

  setPinned(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'pinned', value)
  }
}

export class WindowManagerRenderer implements IAkariShardInitDispose {
  static id = 'window-manager-renderer'
  static dependencies = [
    'setting-utils-renderer',
    'akari-ipc-renderer',
    'pinia-mobx-utils-renderer',
    'logger-renderer'
  ]

  private context: WindowManagerRendererContext

  public mainWindow: AkariMainWindow
  public auxWindow: AkariAuxWindow
  public opggWindow: AkariOpggWindow

  constructor(deps: any) {
    this.context = {
      setting: deps['setting-utils-renderer'],
      ipc: deps['akari-ipc-renderer'],
      pm: deps['pinia-mobx-utils-renderer']
    }

    this.mainWindow = new AkariMainWindow(this.context)
    this.auxWindow = new AkariAuxWindow(this.context)
    this.opggWindow = new AkariOpggWindow(this.context)
  }

  async onInit() {
    const store = useWindowManagerStore()
    await this.context.pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this.context.pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)

    await this.mainWindow.onInit()
    await this.auxWindow.onInit()
    await this.opggWindow.onInit()
  }

  setBackgroundMaterial(value: string) {
    return this.context.setting.set(MAIN_SHARD_NAMESPACE, 'backgroundMaterial', value)
  }
}
