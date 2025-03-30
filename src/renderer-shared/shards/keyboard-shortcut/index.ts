import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

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
@Shard(KeyboardShortcutsRenderer.id)
export class KeyboardShortcutsRenderer implements IAkariShardInitDispose {
  static id = 'keyboard-shortcuts-renderer'

  static DISABLED_KEYS_TARGET_ID = 'akari-disabled-keys'

  constructor(@Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer) {}

  onShortcut(fn: (event: ShortcutDetails) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'shortcut', fn)
  }

  onLastActiveShortcut(fn: (event: ShortcutDetails) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'last-active-shortcut', fn)
  }

  getRegistration(shortcutId: string): Promise<{
    type: 'last-active' | 'normal'
    targetId: string
  }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getRegistration', shortcutId)
  }

  async onInit() {}
}
