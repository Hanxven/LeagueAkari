import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { Dep, Shard } from '@shared/akari-shard'

import { useOpggStore } from './store'

@Shard(OpggRenderer.id)
export class OpggRenderer {
  static id = 'opgg-renderer'

  constructor(@Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer) {}

  async onInit() {
    const store = useOpggStore()

    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyItems')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyRunes')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplySpells')
  }
}
