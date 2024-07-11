import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'
import { MatchHistory } from '@shared/types/lcu/match-history'

import { useExternalDataSourceStore } from './store'

class SgpEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    this._edsm.simpleSync('sgp/availability', (s) => (store.sgpAvailability = s))
  }

  getMatchHistoryLcuFormat(
    playerPuuid: string,
    start: number,
    count: number,
    sgpServerId?: string
  ): Promise<MatchHistory> {
    return this._edsm.call('get-match-history-lcu-format', playerPuuid, start, count, sgpServerId)
  }
}

class BalanceEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    this._edsm.simpleSync('balance/data', (s) => (store.balanceData = s))
  }
}

export class ExternalDataSourceRendererModule extends StateSyncModule {
  sgp = new SgpEdsRenderer(this)
  balance = new BalanceEdsRenderer(this)

  constructor() {
    super('external-data-source')
  }

  override async setup() {
    await super.setup()

    await this.sgp.setup()
    await this.balance.setup()

    // FOR DEBUGGING
    // @ts-ignore
    window.sgp = this.sgp.getMatchHistoryLcuFormat.bind(this.sgp)
  }
}

export const externalDataSourceRendererModule = new ExternalDataSourceRendererModule()
