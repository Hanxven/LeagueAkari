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
import { reactive, ref, shallowReactive, shallowRef } from 'vue'

// copied from main shard
interface OngoingGameInfo {
  queueId: number
  queueType: string
  gameId: number
  gameMode: string
}

// copied from main shard
export interface MatchHistoryPlayer {
  source: 'lcu' | 'sgp'
  tag?: string
  targetCount: number
  data: Game[]
}

// copied from main shard
export interface SummonerPlayer {
  source: 'lcu' | 'sgp'
  data: SummonerInfo
}

// copied from main shard
export interface RankedStatsPlayer {
  source: 'lcu' | 'sgp'
  data: RankedStats
}

// copied from main shard
export interface ChampionMasteryPlayer {
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

// copied from main shard
export type QueryStage =
  | {
      phase: 'champ-select' | 'in-game'
      gameInfo: {
        queueId: number
        queueType: string
        gameId: number
        gameMode: string
      }
    }
  | {
      phase: 'unavailable'
      gameInfo: null
    }

export const useOngoingGameStore = defineStore('shard:ongoing-game-renderer', () => {
  const settings = shallowReactive({
    enabled: false,
    premadeTeamThreshold: 3,
    matchHistoryLoadCount: 20,
    concurrency: 3,
    matchHistoryUseSgpApi: true,
    matchHistoryTagPreference: 'current' as 'current' | 'all',
    gameTimelineLoadCount: 0,

    // renderer only
    orderPlayerBy: 'default' as
      | 'win-rate'
      | 'kda'
      | 'default'
      | 'akari-score'
      | 'position'
      | 'premade-team'
  })

  const frontendSettings = reactive({
    showChampionUsage: 'recent' as 'recent' | 'mastery' | 'none',
    showMatchHistoryItemBorder: false,
    autoRouteWhenGameStarts: false,
    playerCardTags: {
      showPremadeTeamTag: true,
      showSuspiciousFlashPositionTag: true,
      showWinningStreakTag: true,
      showLosingStreakTag: true,
      showSoloKillsTag: true,
      showSoloDeathsTag: true,
      showGreatPerformanceTag: true,
      showAverageTeamDamageTag: false,
      showAverageTeamDamageTakenTag: false,
      showAverageTeamGoldTag: false,
      showAverageDamageGoldEfficiencyTag: false,
      showAverageEnemyMissingPingsTag: false,
      showAverageVisionScoreTag: false,
      showSelfTag: true,
      showMetTag: true,
      showTaggedTag: true,
      showWinRateTeamTag: true,
      showPrivacyTag: true,
      showAkariScoreTag: true
    }
  })

  const gameInfo = shallowRef<OngoingGameInfo | null>(null)
  const championSelections = shallowRef<Record<string, number>>({})
  const positionAssignments = shallowRef<
    Record<
      string,
      {
        position: string
        role: ParsedRole | null
      }
    >
  >({})
  const teams = shallowRef<Record<string, string[]>>({})

  // untyped
  const queryStage = shallowRef<QueryStage>({ phase: 'unavailable', gameInfo: null })
  const isInEog = shallowRef(false)
  const inferredPremadeTeams = shallowRef<Record<string, string[][]>>({})

  const playerStats = shallowRef<{
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null>(null)

  const matchHistoryTag = shallowRef<string | null>(null)

  const matchHistory = ref<Record<string, MatchHistoryPlayer>>({})
  const summoner = ref<Record<string, SummonerPlayer>>({})
  const rankedStats = ref<Record<string, RankedStatsPlayer>>({})
  const championMastery = ref<Record<string, ChampionMasteryPlayer>>({})
  const savedInfo = ref<Record<string, SavedInfo>>({})

  const cachedGames = ref<Record<number, Game>>({})

  const matchHistoryLoadingState = ref<Record<string, string>>({})

  const summonerLoadingState = ref<Record<string, string>>({}) // 未实装
  const savedInfoLoadingState = ref<Record<string, string>>({}) // 未实装
  const rankedStatsLoadingState = ref<Record<string, string>>({}) // 未实装
  const championMasteryLoadingState = ref<Record<string, string>>({}) // 未实装

  const teamParticipantGroups = shallowRef<Record<string, string[]>>({})

  return {
    settings,
    frontendSettings,

    gameInfo,
    championSelections,
    positionAssignments,
    teams,
    queryStage,
    isInEog,
    inferredPremadeTeams,
    playerStats,
    matchHistoryTag,

    matchHistory,
    summoner,
    rankedStats,
    championMastery,
    savedInfo,

    cachedGames,

    matchHistoryLoadingState,
    summonerLoadingState,
    savedInfoLoadingState,
    rankedStatsLoadingState,
    championMasteryLoadingState,
    teamParticipantGroups
  }
})
