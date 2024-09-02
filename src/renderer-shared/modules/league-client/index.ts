import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { UxCommandLine } from '../lcu-connection/store'
import { useLeagueClientStore } from './store'

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

    this.simpleSync(
      'settings/terminate-game-client-on-alt-f4',
      (s) => (store.settings.terminateGameClientOnAltF4 = s)
    )
  }

  fixWindowMethodA() {
    return this.call('fix-window-method-a')
  }

  setFixWindowMethodAOptions(option: { baseWidth: number; baseHeight: number }) {
    return this.call('set-setting/fix-window-method-a-options', option)
  }

  getLaunchedClients(): Promise<UxCommandLine[]> {
    return this.call('get-launched-clients')
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    return this.call('set-setting/terminate-game-client-on-alt-f4', value)
  }

  terminateGameClient() {
    return this.call('terminate-game-client')
  }
}

export const leagueClientRendererModule = new LeagueClientRendererModule()
