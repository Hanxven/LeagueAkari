import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useWindowManagerStore } from './store'

const MAIN_SHARD_NAMESPACE = 'window-manager-main'

export class WindowManagerRenderer implements IAkariShardInitDispose {
  static id = 'window-manager-renderer'
  static dependencies = [
    'setting-utils-renderer',
    'akari-ipc-renderer',
    'pinia-mobx-utils-renderer',
    'logger-renderer'
  ]

  private readonly _setting: SettingUtilsRenderer
  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _log: LoggerRenderer

  constructor(deps: any) {
    this._setting = deps['setting-utils-renderer']
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._log = deps['logger-renderer']
  }

  async onInit() {
    const store = useWindowManagerStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }

  onAskClose(fn: (...args: any[]) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'main-window-close-asking', fn)
  }

  maximizeMainWindow() {
    this._log.info(WindowManagerRenderer.id, '最大化主窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/maximize')
  }

  minimizeMainWindow() {
    this._log.info(WindowManagerRenderer.id, '最小化主窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/minimize')
  }

  restoreMainWindow() {
    this._log.info(WindowManagerRenderer.id, '恢复主窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/restore')
  }

  closeMainWindow(strategy?: string) {
    this._log.info(WindowManagerRenderer.id, '关闭主窗口', `策略: ${strategy || '[NONE]'}`)
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/close', strategy)
  }

  toggleMainWindowDevtools() {
    this._log.info(WindowManagerRenderer.id, '切换主窗口开发者工具')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/toggleDevtools')
  }

  hideMainWindow() {
    this._log.info(WindowManagerRenderer.id, '隐藏主窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/hide')
  }

  showMainWindow() {
    this._log.info(WindowManagerRenderer.id, '显示主窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/show')
  }

  minimizeAuxWindow() {
    this._log.info(WindowManagerRenderer.id, '最小化辅助窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'aux-window/minimize')
  }

  restoreAuxWindow() {
    this._log.info(WindowManagerRenderer.id, '恢复辅助窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'aux-window/restore')
  }

  hideAuxWindow() {
    this._log.info(WindowManagerRenderer.id, '隐藏辅助窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'aux-window/hide')
  }

  showAuxWindow() {
    this._log.info(WindowManagerRenderer.id, '显示辅助窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'aux-window/show')
  }

  resetAuxWindowPosition() {
    this._log.info(WindowManagerRenderer.id, '重置辅助窗口位置')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'aux-window/resetWindowPosition')
  }

  setAuxWindowFunctionality(functionality: string) {
    this._log.info(WindowManagerRenderer.id, '设置辅助窗口功能', functionality)
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'aux-window/setFunctionality', functionality)
  }

  unmaximizeMainWindow() {
    this._log.info(WindowManagerRenderer.id, '取消最大化主窗口')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/unmaximize')
  }

  setMainWindowCloseAction(value: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'mainWindowCloseAction', value)
  }

  setAuxWindowAutoShow(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'auxWindowAutoShow', value)
  }

  setAuxWindowEnabled(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'auxWindowEnabled', value)
  }

  setAuxWindowOpacity(value: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'auxWindowOpacity', value)
  }

  setAuxWindowPinned(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'auxWindowPinned', value)
  }

  setAuxWindowShowSkinSelector(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'auxWindowShowSkinSelector', value)
  }

  setMainWindowBackgroundMaterial(value: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'main-window/setBackgroundMaterial', value)
  }

  setAuxWindowBackgroundMaterial(value: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'aux-window/setBackgroundMaterial', value)
  }

  mainWindowOpenDialog(
    properties = ['openFile'],
    filters: {
      extensions: string[]
      name: string
    }[] = [{ name: 'All Files', extensions: ['*'] }]
  ) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'main-window/openDialog', properties, filters)
  }
}
