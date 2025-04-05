import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useAutoReplyStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-reply-main'

@Shard(AutoReplyRenderer.id)
export class AutoReplyRenderer implements IAkariShardInitDispose {
  static id = 'auto-reply-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  setEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', enabled)
  }

  setText(text: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'text', text)
  }

  setEnableOnAway(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enableOnAway', enabled)
  }

  setLockOfflineStatus(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'lockOfflineStatus', enabled)
  }

  async onInit() {
    const store = useAutoReplyStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
