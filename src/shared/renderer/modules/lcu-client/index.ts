import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

import { useLeagueClientStore } from './store'

export class LeagueClientRendererModule extends StateSyncModule {
  constructor() {
    super('lcu-client')
  }

  override async setup() {
    await super.setup()

    this._setupStateSync()
  }

  private _setupStateSync() {
    const store = useLeagueClientStore()

    this.simpleSync(
      'settings/fix-window-method-a-options',
      (s) => (store.settings.fixWindowMethodAOptions = s)
    )
  }

  fixWindowMethodA() {
    return this.call('fix-window-method-a')
  }

  setFixWindowMethodAOptions(option: { baseWidth: number; baseHeight: number }) {
    return this.call('set-setting/fix-window-method-a-options', option)
  }

  queryLcuAuth() {
    return this.call('query-lcu-auth')
  }
}

export const lcuClientRendererModule = new LeagueClientRendererModule()
