import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useAutoReplyStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-reply-main'

export class AutoReplyRenderer implements IAkariShardInitDispose {
  static id = 'auto-reply-renderer'
  static dependencies = [AkariIpcRenderer.id, SettingUtilsRenderer.id, PiniaMobxUtilsRenderer.id]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps[AkariIpcRenderer.id]
    this._pm = deps[PiniaMobxUtilsRenderer.id]
    this._setting = deps[SettingUtilsRenderer.id]
  }

  setEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', enabled)
  }

  setText(text: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'text', text)
  }

  setEnableOnAway(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enableOnAway', enabled)
  }

  async onInit() {
    const store = useAutoReplyStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
