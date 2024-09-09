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
    this.stateSync('settings', store.settings)
  }

  fixWindowMethodA() {
    return this.call('fix-window-method-a')
  }

  setFixWindowMethodAOptions(option: { baseWidth: number; baseHeight: number }) {
    return this.call('set-setting', 'fixWindowMethodAOptions', option)
  }

  getLaunchedClients(): Promise<UxCommandLine[]> {
    return this.call('get-launched-clients')
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    return this.call('set-setting', 'terminateGameClientOnAltF4', value)
  }

  launchSpectator(config: { locale?: string; region: string; puuid: string }) {
    return this.call('launch-spectator', config)
  }

  terminateGameClient() {
    return this.call('terminate-game-client')
  }
}

export const leagueClientRendererModule = new LeagueClientRendererModule()
