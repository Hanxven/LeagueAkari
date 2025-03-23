import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'

import { useOpggStore } from './store'

export class OpggRenderer {
  static id = 'opgg-renderer'
  static dependencies = [SettingUtilsRenderer.id]

  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._setting = deps[SettingUtilsRenderer.id]
  }

  async onInit() {
    const store = useOpggStore()

    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyItems')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyRunes')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplySpells')
  }
}
