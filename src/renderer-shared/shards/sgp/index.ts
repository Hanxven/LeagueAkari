import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AvailableServersMap } from '@shared/data-sources/sgp'
import { SpectatorData } from '@shared/data-sources/sgp/types'
import { Game, MatchHistory } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from './store'

const MAIN_SHARD_NAMESPACE = 'sgp-main'

export class SgpRenderer implements IAkariShardInitDispose {
  static id = 'sgp-renderer'
  static dependencies = ['akari-ipc-renderer', 'pinia-mobx-utils-renderer']

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
  }

  getSupportedSgpServers() {
    return this._ipc.call<AvailableServersMap>(MAIN_SHARD_NAMESPACE, 'getSupportedSgpServers')
  }

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
    return this._ipc.call<SummonerInfo>(
      MAIN_SHARD_NAMESPACE,
      'getSummonerLcuFormat',
      puuid,
      sgpServerId
    )
  }

  async onInit() {
    const store = useSgpStore()

    this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }
}
