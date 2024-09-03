import {
  SgpMatchHistoryLol,
  SgpRankedStats,
  SgpSummoner,
  SpectatorData
} from '@shared/data-sources/sgp/types'
import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'
import { MatchHistory } from '@shared/types/lcu/match-history'
import { SummonerInfo } from '@shared/types/lcu/summoner'

import { useExternalDataSourceStore } from './store'

class SgpEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    await this._edsm.getterSync('sgp/availability', (s) => (store.sgpAvailability = s))
  }

  getMatchHistoryLcuFormat(
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string | null,
    sgpServerId?: string
  ): Promise<MatchHistory> {
    return this._edsm.call(
      'sgp/get-match-history-lcu-format',
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
    return this._edsm.call('sgp/get-match-history', playerPuuid, start, count, tag, sgpServerId)
  }

  getSummoner(puuid: string, sgpServerId?: string): Promise<SgpSummoner> {
    return this._edsm.call('sgp/get-summoner', puuid, sgpServerId)
  }

  getSummonerLcuFormat(playerPuuid: string, sgpServerId?: string): Promise<SummonerInfo> {
    return this._edsm.call('sgp/get-summoner-lcu-format', playerPuuid, sgpServerId)
  }

  getRankedStats(puuid: string, sgpServerId?: string): Promise<SgpRankedStats> {
    return this._edsm.call('sgp/get-ranked-stats', puuid, sgpServerId)
  }

  getSpectatorGameflow(
    playerPuuid: string,
    sgpServerId?: string
  ): Promise<SpectatorData> {
    return this._edsm.call('sgp/get-spectator-gameflow', playerPuuid, sgpServerId)
  }
}

class BalanceEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    this._edsm.getterSync('fandom/balance-data', (s) => (store.balanceData = s))
  }
}

export class GtimgEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    this._edsm.getterSync('gtimg/hero-list', (s) => (store.heroList = s))
  }
}

class OpggEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {}

  writeItemSetsToDisk(itemSets: any[], clearPrevious = true) {
    return this._edsm.call('opgg/write-item-sets-to-disk', itemSets, clearPrevious)
  }
}

export class ExternalDataSourceRendererModule extends StateSyncModule {
  sgp = new SgpEdsRenderer(this)
  balance = new BalanceEdsRenderer(this)
  gtimg = new GtimgEdsRenderer(this)
  opgg = new OpggEdsRenderer(this)

  constructor() {
    super('external-data-source')
  }

  override async setup() {
    await super.setup()

    await this.sgp.setup()
    await this.balance.setup()
    await this.gtimg.setup()
    await this.opgg.setup()

    // FOR DEBUGGING
    // @ts-ignore
    window.sgp = this.sgp
  }
}

export const externalDataSourceRendererModule = new ExternalDataSourceRendererModule()
