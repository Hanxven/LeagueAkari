import { Mastery } from '@shared/types/lcu/champion-mastery'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { ParsedRole } from '@shared/utils/ranked'
import { defineStore } from 'pinia'
import { reactive, ref, shallowRef, watchEffect } from 'vue'

// copied from main process
export interface EncounteredGame {
  id: number

  gameId: number

  puuid: string

  selfPuuid: string

  region: string

  rsoPlatformId: string

  updateAt: Date

  queueType: string
}

/**
 * 存储在本地的玩家信息
 */
export interface SavedPlayerInfo {
  puuid: string

  selfPuuid: string

  tag: string

  updateAt: Date

  lastMetAt: Date

  region: string

  rsoPlatformId: string

  encounteredGames: EncounteredGame[]
}

/**
 * copied from 主进程
 */
export interface OngoingPlayer {
  puuid: string

  /**
   * 召唤师信息
   */
  summoner?: SummonerInfo

  /**
   * 玩家排位赛信息
   */
  rankedStats?: RankedStats

  /**
   * 用于分析的战绩列表封装
   */
  matchHistory?: MatchHistoryGameWithState[]

  /**
   * 玩家英雄点数相关信息
   */
  championMastery?: Record<number, Mastery>

  /**
   * 记录的玩家信息
   */
  savedInfo?: SavedPlayerInfo
}

export interface MatchHistoryGameWithState {
  game: Game
  isDetailed: boolean
}

/** 和战绩相关的一切基础功能 store */
export const useCoreFunctionalityStore = defineStore('module:core-functionality', () => {
  const ongoingPlayers = ref<
    Record<
      string, // puuid
      OngoingPlayer
    >
  >({})

  const ongoingGameInfo = ref<{
    queueType: string // 当前的游戏相关信息
    gameId: number
  } | null>(null)

  const ongoingPreMadeTeams = shallowRef<Record<string, string[][]>>({})

  const sendList = ref<Record<string, boolean>>({})

  const ongoingTeams = shallowRef<Record<string, number[]> | null>(null)
  const ongoingChampionSelections = shallowRef<Record<string | number, number> | null>(null)
  const ongoingPositionAssignments = shallowRef<Record<
    string,
    {
      position: string
      role: ParsedRole | null
    }
  > | null>(null)

  const queryState = ref<{
    phase: 'unavailable' | 'in-game' | 'champ-select'
    gameInfo: {
      queueId: number
      queueType: string
      gameId: number
      gameMode: string
    } | null
  }>({
    phase: 'unavailable',
    gameInfo: null
  })
  const isInEndgamePhase = ref(false)
  const queueFilter = ref(-1)

  const ongoingPlayerAnalysis = shallowRef<{
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null>(null)

  watchEffect(() => {
    console.log('[DEBUG] 玩家战绩分析', ongoingPlayerAnalysis.value)
  })

  // 战绩加载功能
  const settings = reactive({
    fetchAfterGame: true,
    autoRouteOnGameStart: true,

    // 是否开启对局分析
    ongoingAnalysisEnabled: false,

    // 用于判断预组队的阈值
    preMadeTeamThreshold: 3,

    // 是否拉取页面的所有详细对局
    fetchDetailedGame: false,

    // 拉取分页大小
    matchHistoryLoadCount: 20,

    // 允许在游戏内发送对局 KDA 信息
    sendKdaInGame: false,

    // 预组队信息
    sendKdaInGameWithPreMadeTeams: true,

    // 发送 KDA 信息需保证 KDA 大于此值
    sendKdaThreshold: 0,

    // 对局中战绩获取的最大并发限制
    playerAnalysisFetchConcurrency: 3,

    useSgpApi: true
  })

  return {
    ongoingPlayers,
    ongoingGameInfo,
    ongoingTeams,
    ongoingPreMadeTeams,
    queryState,
    isInEndgamePhase,
    ongoingChampionSelections,
    ongoingPositionAssignments,
    ongoingPlayerAnalysis,
    queueFilter,
    settings,
    sendList
  }
})
