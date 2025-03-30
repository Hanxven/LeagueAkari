import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useRespawnTimerStore } from './store'

const MAIN_SHARD_NAMESPACE = 'respawn-timer-main'

@Shard(RespawnTimerRenderer.id)
export class RespawnTimerRenderer implements IAkariShardInitDispose {
  static id = 'respawn-timer-renderer'

  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  async onInit() {
    const store = useRespawnTimerStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }

  setEnabled(value: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'enabled', value)
  }
}
