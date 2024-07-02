import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'
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

    this.simpleSync('is-in-endgame-phase', (s) => (store.isInEndgamePhase = s))
    this.simpleSync('ongoing-game-info', (s) => (store.ongoingGameInfo = s))
    this.simpleSync('query-state', (s) => (store.queryState = s))
    this.simpleSync('ongoing-champion-selections', (s) => (store.ongoingChampionSelections = s))
    this.simpleSync('ongoing-pre-made-teams', (s) => (store.ongoingPreMadeTeams = s))
    this.simpleSync('ongoing-teams', (s) => (store.ongoingTeams = s))
    this.simpleSync('send-list', (s) => (store.sendList = s))

    this.simpleSync(
      'settings/auto-route-on-game-start',
      (s) => (store.settings.autoRouteOnGameStart = s)
    )
    this.simpleSync(
      'settings/ongoing-analysis-enabled',
      (s) => (store.settings.ongoingAnalysisEnabled = s)
    )
    this.simpleSync('settings/fetch-after-game', (s) => (store.settings.fetchAfterGame = s))
    this.simpleSync('settings/fetch-detailed-game', (s) => (store.settings.fetchDetailedGame = s))
    this.simpleSync(
      'settings/match-history-load-count',
      (s) => (store.settings.matchHistoryLoadCount = s)
    )
    this.simpleSync(
      'settings/pre-made-team-threshold',
      (s) => (store.settings.preMadeTeamThreshold = s)
    )
    this.simpleSync('settings/send-kda-in-game', (s) => (store.settings.sendKdaInGame = s))
    this.simpleSync(
      'settings/send-kda-in-game-with-pre-made-teams',
      (s) => (store.settings.sendKdaInGameWithPreMadeTeams = s)
    )
    this.simpleSync('settings/send-kda-threshold', (s) => (store.settings.sendKdaThreshold = s))
    this.simpleSync(
      'settings/player-analysis-fetch-concurrency',
      (s) => (store.settings.playerAnalysisFetchConcurrency = s)
    )
    this.simpleSync(
      'settings/delay-seconds-before-loading',
      (s) => (store.settings.delaySecondsBeforeLoading = s)
    )
    this.simpleSync('is-waiting-for-delay', (s) => (store.isWaitingForDelay = s))
  }

  /**
   * 部分特殊状态需要手动同步
   */
  private _syncOngoingInfo() {
    const store = useCoreFunctionalityStore()

    this.onEvent('create/ongoing-player', (puuid) => {
      store.ongoingPlayers[puuid] = { puuid }
    })

    this.onEvent('update/ongoing-player/summoner', (puuid, info) => {
      if (store.ongoingPlayers[puuid]) {
        store.ongoingPlayers[puuid].summoner = info
      }
    })

    this.onEvent('update/ongoing-player/saved-info', (puuid, info) => {
      if (store.ongoingPlayers[puuid]) {
        store.ongoingPlayers[puuid].savedInfo = info
      }
    })

    this.onEvent('update/ongoing-player/ranked-stats', (puuid, ranked) => {
      if (store.ongoingPlayers[puuid]) {
        store.ongoingPlayers[puuid].rankedStats = ranked
      }
    })

    this.onEvent(
      'update/ongoing-player/match-history',
      (puuid, history: { idDetailed: boolean; game: Game }[]) => {
        if (store.ongoingPlayers[puuid]) {
          store.ongoingPlayers[puuid].matchHistory = history.map((g) => ({
            isDetailed: g.idDetailed,
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

  setSendPlayer(puuid: string, send: boolean) {
    return this.call('update/send-list', puuid, send)
  }

  setAutoRouteOnGameStart(value: boolean) {
    return this.call('set-setting/auto-route-on-game-start', value)
  }

  setFetchAfterGame(value: boolean) {
    return this.call('set-setting/fetch-after-game', value)
  }

  setFetchDetailedGame(value: boolean) {
    return this.call('set-setting/fetch-detailed-game', value)
  }

  setMatchHistoryLoadCount(value: number) {
    return this.call('set-setting/match-history-load-count', value)
  }

  setPreMadeTeamThreshold(value: number) {
    return this.call('set-setting/pre-made-team-threshold', value)
  }

  setSendKdaInGame(value: boolean) {
    return this.call('set-setting/send-kda-in-game', value)
  }

  setSendKdaInGameWithPreMadeTeams(value: boolean) {
    return this.call('set-setting/send-kda-in-game-with-pre-made-teams', value)
  }

  setOngoingAnalysisEnabled(value: boolean) {
    return this.call('set-setting/ongoing-analysis-enabled', value)
  }

  setSendKdaThreshold(value: number) {
    return this.call('set-setting/send-kda-threshold', value)
  }

  setPlayerAnalysisFetchConcurrency(value: number) {
    return this.call('set-setting/player-analysis-fetch-concurrency', value)
  }

  saveSavedPlayer(player: object) {
    return this.call('save/saved-player', player)
  }

  setDelaySecondsBeforeLoading(value: number) {
    return this.call('set-setting/delay-seconds-before-loading', value)
  }
}

export const coreFunctionalityRendererModule = new CoreFunctionalityRendererModule()
