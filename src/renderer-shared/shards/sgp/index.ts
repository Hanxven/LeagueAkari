import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpSummoner, SpectatorData } from '@shared/data-sources/sgp/types'
import { Game, MatchHistory } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from './store'

const MAIN_SHARD_NAMESPACE = 'sgp-main'

@Shard(SgpRenderer.id)
export class SgpRenderer implements IAkariShardInitDispose {
  static id = 'sgp-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer
  ) {}

  getMatchHistoryLcuFormat(
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string,
    sgpServerId?: string
  ) {
    return this._ipc.call<MatchHistory>(
      MAIN_SHARD_NAMESPACE,
      'getMatchHistoryLcuFormat',
      playerPuuid,
      start,
      count,
      tag,
      sgpServerId
    )
  }

  getGameSummaryLcuFormat(gameId: number, sgpServerId?: string) {
    return this._ipc.call<Game>(
      MAIN_SHARD_NAMESPACE,
      'getGameSummaryLcuFormat',
      gameId,
      sgpServerId
    )
  }

  getSpectatorGameflow(puuid: string, sgpServerId?: string) {
    return this._ipc.call<SpectatorData>(
      MAIN_SHARD_NAMESPACE,
      'getSpectatorGameflow',
      puuid,
      sgpServerId
    )
  }

  getSummonerLcuFormat(puuid: string, sgpServerId?: string) {
    return this._ipc.call<SummonerInfo | null>(
      MAIN_SHARD_NAMESPACE,
      'getSummonerLcuFormat',
      puuid,
      sgpServerId
    )
  }

  getSummoner(puuid: string, sgpServerId?: string): Promise<SgpSummoner | null> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getSummoner', puuid, sgpServerId)
  }

  async onInit() {
    const store = useSgpStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }
}
