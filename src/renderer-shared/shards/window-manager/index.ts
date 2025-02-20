import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { BaseAkariWindowRenderer } from './base-akari-window'
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

class AkariMainWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useMainWindowStore>,
  ReturnType<typeof useMainWindowStore>['settings']
> {
  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_MAIN_WINDOW,
      () => useMainWindowStore(),
      () => useMainWindowStore().settings
    )
  }

  onAskClose(fn: (...args: any[]) => void) {
    return this._context.ipc.onEventVue(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'close-asking', fn)
  }

  setCloseAction(value: string) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'closeAction', value)
  }

  override close(strategy?: string) {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'closeMainWindow', strategy)
  }
}

class AkariAuxWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useAuxWindowStore>,
  ReturnType<typeof useAuxWindowStore>['settings']
> {
  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_AUX_WINDOW,
      () => useAuxWindowStore(),
      () => useAuxWindowStore().settings
    )
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'enabled', value)
  }

  setShowSkinSelector(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'showSkinSelector', value)
  }
}

class AkariOpggWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useOpggWindowStore>,
  ReturnType<typeof useOpggWindowStore>['settings']
> {
  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_OPGG_WINDOW,
      () => useOpggWindowStore(),
      () => useOpggWindowStore().settings
    )
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'enabled', value)
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
