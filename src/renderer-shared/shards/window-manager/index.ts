import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { BaseAkariWindowRenderer } from './base-akari-window'
import {
  useAuxWindowStore,
  useCdTimerWindowStore,
  useMainWindowStore,
  useOngoingGameWindowStore,
  useOpggWindowStore,
  useWindowManagerStore
} from './store'

const MAIN_SHARD_NAMESPACE = 'window-manager-main'
const MAIN_SHARD_NAMESPACE_MAIN_WINDOW = 'window-manager-main/main-window'
const MAIN_SHARD_NAMESPACE_AUX_WINDOW = 'window-manager-main/aux-window'
const MAIN_SHARD_NAMESPACE_OPGG_WINDOW = 'window-manager-main/opgg-window'
const MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW = 'window-manager-main/ongoing-game-window'
const MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW = 'window-manager-main/cd-timer-window'

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

  repositionToAlignLeagueClientUx() {
    return this._context.ipc.call(
      MAIN_SHARD_NAMESPACE_AUX_WINDOW,
      'repositionToAlignLeagueClientUx',
      'top-right'
    )
  }
}

export class AkariOpggWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useOpggWindowStore>,
  ReturnType<typeof useOpggWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${MAIN_SHARD_NAMESPACE_OPGG_WINDOW}/show`

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

  setShowShortcut(value: string | null) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'showShortcut', value)
  }

  repositionToAlignLeagueClientUx() {
    return this._context.ipc.call(
      MAIN_SHARD_NAMESPACE_OPGG_WINDOW,
      'repositionToAlignLeagueClientUx',
      'top-left'
    )
  }
}

export class AkariOngoingGameWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useOngoingGameWindowStore>,
  ReturnType<typeof useOngoingGameWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW,
      () => useOngoingGameWindowStore(),
      () => useOngoingGameWindowStore().settings
    )
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(
      MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW,
      'showShortcut',
      value
    )
  }
}

export class AkariCdTimerWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useCdTimerWindowStore>,
  ReturnType<typeof useCdTimerWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW,
      () => useCdTimerWindowStore(),
      () => useCdTimerWindowStore().settings
    )
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'showShortcut', value)
  }

  setTimerType(value: 'countdown' | 'countup') {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'timerType', value)
  }

  // 一份复制后的逻辑, 嗯. 就这样吧
  sendInGame(text: string) {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'sendInGame', text)
  }
}

@Shard(WindowManagerRenderer.id)
export class WindowManagerRenderer implements IAkariShardInitDispose {
  static id = 'window-manager-renderer'

  private context: WindowManagerRendererContext

  public mainWindow: AkariMainWindow
  public auxWindow: AkariAuxWindow
  public opggWindow: AkariOpggWindow
  public ongoingGameWindow: AkariOngoingGameWindow
  public cdTimerWindow: AkariCdTimerWindow

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer
  ) {
    this.context = {
      setting: this._setting,
      ipc: this._ipc,
      pm: this._pm
    }

    this.mainWindow = new AkariMainWindow(this.context)
    this.auxWindow = new AkariAuxWindow(this.context)
    this.opggWindow = new AkariOpggWindow(this.context)
    this.ongoingGameWindow = new AkariOngoingGameWindow(this.context)
    this.cdTimerWindow = new AkariCdTimerWindow(this.context)
  }

  async onInit() {
    const store = useWindowManagerStore()
    await this.context.pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this.context.pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)

    await this.mainWindow.onInit()
    await this.auxWindow.onInit()
    await this.opggWindow.onInit()
    await this.ongoingGameWindow.onInit()
    await this.cdTimerWindow.onInit()
  }

  setBackgroundMaterial(value: string) {
    return this.context.setting.set(MAIN_SHARD_NAMESPACE, 'backgroundMaterial', value)
  }
}
