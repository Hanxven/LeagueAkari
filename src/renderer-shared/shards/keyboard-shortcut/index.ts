import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'

const MAIN_SHARD_NAMESPACE = 'keyboard-shortcuts-main'

// copied from main shard
interface ShortcutDetails {
  keyCodes: number[]
  keys: {
    keyId: string
    isModifier: boolean
    keyCode: number
  }[]
  id: string
  unifiedId: string
}

/**
 * 连接到主进程的快捷键服务
 */
export class KeyboardShortcutsRenderer implements IAkariShardInitDispose {
  static id = 'keyboard-shortcuts-renderer'
  static dependencies = ['akari-ipc-renderer']

  private readonly _ipc: AkariIpcRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
  }

  onShortcut(fn: (event: ShortcutDetails) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'shortcut', fn)
  }

  onLastActiveShortcut(fn: (event: ShortcutDetails) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'last-active-shortcut', fn)
  }

  async onInit() {}
}
