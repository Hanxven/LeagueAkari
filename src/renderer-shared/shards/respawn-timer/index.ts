import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useRespawnTimerStore } from './store'

const MAIN_SHARD_NAMESPACE = 'respawn-timer-main'

export class RespawnTimerRenderer implements IAkariShardInitDispose {
  static id = 'respawn-timer-renderer'
  static dependencies = ['pinia-mobx-utils-renderer', 'setting-utils-renderer']

  private _pm: PiniaMobxUtilsRenderer
  private _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

  async onInit() {
    const store = useRespawnTimerStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }

  setEnabled(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', value)
  }
}
