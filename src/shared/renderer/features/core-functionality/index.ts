import { mainCall, mainStateSync, onMainEvent } from '@shared/renderer/utils/ipc'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { markRaw } from 'vue'

import { OngoingPlayer, useCoreFunctionalityStore } from './store'

// 核心模块，战绩和对局中信息的自动化处理
export async function setupCoreFunctionality() {
  const cf = useCoreFunctionalityStore()

  onMainEvent('core-functionality/ongoing-player/new', (_, puuid: string) => {
    cf.ongoingPlayers[puuid] = {
      puuid
    }
  })

  onMainEvent(
    'core-functionality/ongoing-player/summoner',
    (_, puuid: string, info: SummonerInfo) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].summoner = info
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/saved-info',
    (_, puuid: string, savedInfo: any) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].savedInfo = savedInfo
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/ranked-stats',
    (_, puuid: string, rankedStats: RankedStats) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].rankedStats = rankedStats
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/match-history',
    (_, puuid: string, games: Game[]) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].matchHistory = games.map((g) => ({
          isDetailed: false,
          game: markRaw(g)
        }))
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/match-history-detailed-game',
    (_, puuid: string, game: Game) => {
      if (cf.ongoingPlayers[puuid]) {
        const mh = cf.ongoingPlayers[puuid].matchHistory
        if (mh) {
          const thatGame = mh.find((m) => m.game.gameId === game.gameId)
          if (thatGame) {
            thatGame.isDetailed = true
            thatGame.game = markRaw(game)
          }
        }
      }
    }
  )

  onMainEvent('core-functionality/ongoing-player/clear', () => {
    cf.ongoingPlayers = {}
  })

  mainCall('core-functionality/ongoing-players/get').then((all: Map<string, OngoingPlayer>) => {
    all.forEach((value, key) => {
      cf.ongoingPlayers[key] = value
    })
  })

  mainStateSync('core-functionality/ongoing-state', (s) => (cf.ongoingState = s))
  mainStateSync('core-functionality/ongoing-game-info', (s) => (cf.ongoingGameInfo = s))
  mainStateSync('core-functionality/ongoing-teams', (s) => (cf.ongoingTeams = s))
  mainStateSync('core-functionality/is-in-endgame-phase', (s) => (cf.isInEndgamePhase = s))
  mainStateSync(
    'core-functionality/settings/auto-route-on-game-start',
    (s) => (cf.settings.autoRouteOnGameStart = s)
  )
  mainStateSync(
    'core-functionality/settings/fetch-after-game',
    (s) => (cf.settings.fetchAfterGame = s)
  )
  mainStateSync(
    'core-functionality/settings/fetch-detailed-game',
    (s) => (cf.settings.fetchDetailedGame = s)
  )
  mainStateSync(
    'core-functionality/settings/match-history-load-count',
    (s) => (cf.settings.matchHistoryLoadCount = s)
  )
  mainStateSync(
    'core-functionality/settings/pre-made-team-threshold',
    (s) => (cf.settings.preMadeTeamThreshold = s)
  )
  mainStateSync(
    'core-functionality/settings/send-kda-in-game',
    (s) => (cf.settings.sendKdaInGame = s)
  )
  mainStateSync(
    'core-functionality/settings/send-kda-in-game-with-pre-made-teams',
    (s) => (cf.settings.sendKdaInGameWithPreMadeTeams = s)
  )
  mainStateSync(
    'core-functionality/settings/send-kda-threshold',
    (s) => (cf.settings.sendKdaThreshold = s)
  )
  mainStateSync(
    'core-functionality/settings/team-analysis-preload-count',
    (s) => (cf.settings.teamAnalysisPreloadCount = s)
  )

  mainStateSync(
    'core-functionality/ongoing-champion-selections',
    (s) => (cf.ongoingChampionSelections = s)
  )

  mainStateSync('core-functionality/ongoing-pre-made-teams', (s) => (cf.ongoingPreMadeTeams = s))

  mainStateSync('core-functionality/send-list', (s) => (cf.sendList = s))
}

export function setFetchAfterGame(enabled: boolean) {
  return mainCall('core-functionality/settings/fetch-after-game/set', enabled)
}

export function setAutoRouteOnGameStart(enabled: boolean) {
  return mainCall('core-functionality/settings/auto-route-on-game-start/set', enabled)
}

export function setPreMadeThreshold(threshold: number) {
  return mainCall('core-functionality/settings/pre-made-team-threshold/set', threshold)
}

export function setTeamAnalysisPreloadCount(count: number) {
  return mainCall('core-functionality/settings/team-analysis-preload-count/set', count)
}

export function setMatchHistoryLoadCount(count: number) {
  return mainCall('core-functionality/settings/match-history-load-count/set', count)
}

export function setFetchDetailedGame(enabled: boolean) {
  return mainCall('core-functionality/settings/fetch-detailed-game/set', enabled)
}

export function setSendKdaInGame(enabled: boolean) {
  return mainCall('core-functionality/settings/send-kda-in-game/set', enabled)
}

export function setSendKdaThreshold(kda: number) {
  return mainCall('core-functionality/settings/send-kda-threshold/set', kda)
}

export function setSendKdaInGameWithPreMadeTeams(enabled: boolean) {
  return mainCall('core-functionality/settings/send-kda-in-game-with-pre-made-teams/set', enabled)
}

export function setInGameKdaSendPlayer(puuid: string, send: boolean) {
  return mainCall('core-functionality/send-list/update', puuid, send)
}
