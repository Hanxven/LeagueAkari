import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'
import { Game } from '@shared/types/lcu/match-history'
import { markRaw } from 'vue'

import { OngoingPlayer, useCoreFunctionalityStore } from './store'

export class CoreFunctionalityRendererModule extends StateSyncModule {
  constructor() {
    super('core-functionality')
  }

  override async setup() {
    await super.setup()

    this._syncMainState()
    this._syncOngoingInfo()
  }

  private _syncMainState() {
    const store = useCoreFunctionalityStore()

    this.stateSync('state', store)
  }

  /**
   * 部分特殊状态需要手动同步
   */
  private _syncOngoingInfo() {
    const store = useCoreFunctionalityStore()

    this.onEvent('create/ongoing-player', (puuid) => {
      store.ongoingPlayers[puuid] = { puuid }
    })

    this.onEvent('update/ongoing-player/summoner', (puuid, summoner) => {
      if (store.ongoingPlayers[puuid]) {
        store.ongoingPlayers[puuid].summoner = markRaw(summoner)
      }
    })

    this.onEvent('update/ongoing-player/saved-info', (puuid, info) => {
      if (store.ongoingPlayers[puuid]) {
        store.ongoingPlayers[puuid].savedInfo = markRaw(info)
      }
    })

    this.onEvent('update/ongoing-player/ranked-stats', (puuid, ranked) => {
      if (store.ongoingPlayers[puuid]) {
        store.ongoingPlayers[puuid].rankedStats = markRaw(ranked)
      }
    })

    this.onEvent('update/ongoing-player/champion-mastery', (puuid, mastery) => {
      if (store.ongoingPlayers[puuid]) {
        store.ongoingPlayers[puuid].championMastery = markRaw(mastery)
        console.log('mastery', puuid, mastery)
      }
    })

    this.onEvent(
      'update/ongoing-player/match-history',
      (puuid, history: { isDetailed: boolean; game: Game }[]) => {
        if (store.ongoingPlayers[puuid]) {
          store.ongoingPlayers[puuid].matchHistory = history.map((g) => ({
            isDetailed: g.isDetailed,
            game: markRaw(g.game)
          }))
        }
      }
    )

    this.onEvent('update/ongoing-player/match-history/detailed-game', (puuid, game) => {
      if (store.ongoingPlayers[puuid]) {
        const mh = store.ongoingPlayers[puuid].matchHistory
        if (mh) {
          const thatGame = mh.find((m) => m.game.gameId === game.gameId)
          if (thatGame) {
            thatGame.isDetailed = true
            thatGame.game = markRaw(game)
          }
        }
      }
    })

    this.onEvent('clear/ongoing-players', () => {
      store.ongoingPlayers = {}
    })

    this.call('get/ongoing-players').then((info: Map<string, OngoingPlayer>) => {
      info.forEach((value, key) => {
        store.ongoingPlayers[key] = value
      })
    })
  }

  refresh() {
    return this.call('refresh')
  }

  setSendPlayer(puuid: string, send: boolean) {
    return this.call('set-send-list', puuid, send)
  }

  setAutoRouteOnGameStart(value: boolean) {
    return this.call('set-setting', 'autoRouteOnGameStart', value)
  }

  setFetchAfterGame(value: boolean) {
    return this.call('set-setting', 'fetchAfterGame', value)
  }

  setFetchDetailedGame(value: boolean) {
    return this.call('set-setting', 'fetchDetailedGame', value)
  }

  setMatchHistoryLoadCount(value: number) {
    return this.call('set-setting', 'matchHistoryLoadCount', value)
  }

  setPreMadeTeamThreshold(value: number) {
    return this.call('set-setting', 'preMadeTeamThreshold', value)
  }

  setSendKdaInGame(value: boolean) {
    return this.call('set-setting', 'sendKdaInGame', value)
  }

  setSendKdaInGameWithPreMadeTeams(value: boolean) {
    return this.call('set-setting', 'sendKdaInGameWithPreMadeTeams', value)
  }

  setOngoingAnalysisEnabled(value: boolean) {
    return this.call('set-setting', 'ongoingAnalysisEnabled', value)
  }

  setSendKdaThreshold(value: number) {
    return this.call('set-setting', 'sendKdaThreshold', value)
  }

  setPlayerAnalysisFetchConcurrency(value: number) {
    return this.call('set-setting', 'playerAnalysisFetchConcurrency', value)
  }

  saveSavedPlayer(player: object) {
    return this.call('save/saved-player', player)
  }

  setMatchHistorySource(value: string) {
    return this.call('set-setting', 'matchHistorySource', value)
  }

  setUseSgpApi(value: string) {
    return this.call('set-setting', 'useSgpApi', value)
  }

  setQueueFilter(queueFilter: number) {
    return this.call('set-queue-filter', queueFilter)
  }
}

export const coreFunctionalityRendererModule = new CoreFunctionalityRendererModule()
