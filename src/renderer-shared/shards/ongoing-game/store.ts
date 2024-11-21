import { Mastery } from '@shared/types/league-client/champion-mastery'
import { Game } from '@shared/types/league-client/match-history'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { ParsedRole } from '@shared/utils/ranked'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef, watchEffect } from 'vue'

// copied from main shard
interface OngoingGameInfo {
  queueId: number
  queueType: string
  gameId: number
  gameMode: string
}

// copied from main shard
interface MatchHistoryPlayer {
  source: 'lcu' | 'sgp'
  tag?: string
  targetCount: number
  data: Game[]
}

// copied from main shard
interface SummonerPlayer {
  source: 'lcu' | 'sgp'
  data: SummonerInfo
}

// copied from main shard
interface RankedStatsPlayer {
  source: 'lcu' | 'sgp'
  data: RankedStats
}

// copied from main shard
interface ChampionMasteryPlayer {
  source: 'lcu' | 'sgp'
  data: Record<number, Mastery>
}

// copied from main shard
interface EncounteredGame {
  id: number

  gameId: number

  puuid: string

  selfPuuid: string

  region: string

  rsoPlatformId: string

  updateAt: Date

  queueType: string
}

// copied from main shard
export interface SavedInfo {
  puuid: string

  selfPuuid: string

  region: string

  rsoPlatformId: string

  tag: string | null

  updateAt: Date

  lastMetAt: Date | null

  encounteredGames: EncounteredGame[]
}

export const useOngoingGameStore = defineStore('shard:ongoing-game-renderer', () => {
  const settings = shallowReactive({
    enabled: false,
    premadeTeamThreshold: 3,
    matchHistoryLoadCount: 20,
    concurrency: 3,
    matchHistoryUseSgpApi: true,
    matchHistoryTagPreference: 'current' as 'current' | 'all',

    // renderer only
    orderPlayerBy: 'default' as 'win-rate' | 'kda' | 'default' | 'akari-score'
  })

  const gameInfo = shallowRef<OngoingGameInfo | null>(null)
  const championSelections = shallowRef<Record<string, number> | null>(null)
  const positionAssignments = shallowRef<Record<
    string,
    {
      position: string
      role: ParsedRole | null
    }
  > | null>(null)
  const teams = shallowRef<Record<string, string[]> | null>(null)

  // untyped
  const queryStage = shallowRef<{
    phase: 'unavailable' | 'champ-select' | 'in-game'
  }>({ phase: 'unavailable' })
  const isInEog = shallowRef(false)
  const premadeTeams = shallowRef<Record<string, string[][]> | null>(null)

  const playerStats = shallowRef<{
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null>(null)

  const matchHistoryTag = shallowRef<string | null>(null)

  const matchHistory = shallowRef<Record<string, MatchHistoryPlayer>>({})
  const summoner = shallowRef<Record<string, SummonerPlayer>>({})
  const rankedStats = shallowRef<Record<string, RankedStatsPlayer>>({})
  const championMastery = shallowRef<Record<string, ChampionMasteryPlayer>>({})
  const savedInfo = shallowRef<Record<string, SavedInfo>>({})

  const matchHistoryLoadingState = shallowRef<Record<string, string>>({})
  const summonerLoadingState = shallowRef<Record<string, string>>({}) // 未实装
  const savedInfoLoadingState = shallowRef<Record<string, string>>({}) // 未实装
  const rankedStatsLoadingState = shallowRef<Record<string, string>>({}) // 未实装
  const championMasteryLoadingState = shallowRef<Record<string, string>>({}) // 未实装

  watchEffect(() => {
    console.log(matchHistoryLoadingState.value)
  })

  return {
    settings,

    gameInfo,
    championSelections,
    positionAssignments,
    teams,
    queryStage,
    isInEog,
    premadeTeams,
    playerStats,
    matchHistoryTag,

    matchHistory,
    summoner,
    rankedStats,
    championMastery,
    savedInfo,

    matchHistoryLoadingState,
    summonerLoadingState,
    savedInfoLoadingState,
    rankedStatsLoadingState,
    championMasteryLoadingState
  }
})
