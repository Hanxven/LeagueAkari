import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'

import { useOpggStore } from './store'

export class OpggRenderer {
  static id = 'opgg-renderer'
  static dependencies = ['setting-utils-renderer']

  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._setting = deps['setting-utils-renderer']
  }

  async onInit() {
    const store = useOpggStore()

    this._setting.autoSavePropVue(
      OpggRenderer.id,
      'autoApply',
      () => store.frontendSettings.autoApply,
      (v) => (store.frontendSettings.autoApply = v)
    )
  }
}
