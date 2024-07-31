import {
  SgpMatchHistoryLol,
  SgpRankedStats,
  SgpSummoner
} from '@shared/external-data-source/sgp/types'
import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'
import { MatchHistory } from '@shared/types/lcu/match-history'
import { SummonerInfo } from '@shared/types/lcu/summoner'

import { useExternalDataSourceStore } from './store'

class SgpEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    await this._edsm.simpleSync('sgp/availability', (s) => (store.sgpAvailability = s))
  }

  getMatchHistoryLcuFormat(
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string | null,
    sgpServerId?: string
  ): Promise<MatchHistory> {
    return this._edsm.call(
      'get-match-history-lcu-format',
      playerPuuid,
      start,
      count,
      tag,
      sgpServerId
    )
  }

  getMatchHistory(
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string | null,
    sgpServerId?: string
  ): Promise<SgpMatchHistoryLol> {
    return this._edsm.call('get-match-history', playerPuuid, start, count, tag, sgpServerId)
  }

  getSummoner(puuid: string, sgpServerId?: string): Promise<SgpSummoner> {
    return this._edsm.call('get-summoner', puuid, sgpServerId)
  }

  getSummonerLcuFormat(playerPuuid: string, sgpServerId?: string): Promise<SummonerInfo> {
    return this._edsm.call('get-summoner-lcu-format', playerPuuid, sgpServerId)
  }

  getRankedStats(puuid: string, sgpServerId?: string): Promise<SgpRankedStats> {
    return this._edsm.call('get-ranked-stats', puuid, sgpServerId)
  }
}

class BalanceEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    this._edsm.simpleSync('balance/data', (s) => (store.balanceData = s))
  }
}

export class GtimgEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    this._edsm.simpleSync('gtimg/hero-list', (s) => (store.heroList = s))
  }
}

export class ExternalDataSourceRendererModule extends StateSyncModule {
  sgp = new SgpEdsRenderer(this)
  balance = new BalanceEdsRenderer(this)
  gtimg = new GtimgEdsRenderer(this)

  constructor() {
    super('external-data-source')
  }

  override async setup() {
    await super.setup()

    await this.sgp.setup()
    await this.balance.setup()
    await this.gtimg.setup()

    // FOR DEBUGGING
    // @ts-ignore
    window.sgp = this.sgp
  }
}

export const externalDataSourceRendererModule = new ExternalDataSourceRendererModule()
