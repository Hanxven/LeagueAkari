import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

import { useLeagueClientStore } from './store'
import { LcuAuth } from '../lcu-connection/store'

export class LeagueClientRendererModule extends StateSyncModule {
  constructor() {
    super('league-client')
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

  getLaunchedClients(): Promise<LcuAuth[]> {
    return this.call('get-launched-clients')
  }
}

export const leagueClientRendererModule = new LeagueClientRendererModule()
