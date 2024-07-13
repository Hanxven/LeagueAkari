import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { MatchHistoryGamesAnalysisAll } from '@shared/utils/analysis'
import { defineStore } from 'pinia'
import { reactive, ref, shallowRef, watchEffect } from 'vue'

/**
 * 存储在本地的玩家信息
 */
export interface SavedPlayerInfo {
  summonerId: number

  puuid: string

  selfSummonerId: number

  tag: string

  updateAt: Date

  lastMetAt: Date

  region: string

  rsoPlatformId: string

  encounteredGames: number[]
}

/**
 * 当前正在进行游戏的玩家的基础信息，类型同主进程定义
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

  const ongoingPreMadeTeams = ref<
    {
      players: number[]
      times: number
      team: string
      _id: number
    }[]
  >([])

  const sendList = ref<Record<string | number, boolean>>({})

  const queryState = ref<'unavailable' | 'in-game' | 'champ-select'>('unavailable')
  const ongoingTeams = shallowRef<Record<string, number[]> | null>(null)
  const isInEndgamePhase = ref(false)
  const ongoingChampionSelections = shallowRef<Record<string | number, number> | null>(null)
  const isWaitingForDelay = ref(false)

  const ongoingPlayerAnalysis = shallowRef<Record<string, MatchHistoryGamesAnalysisAll> | null>(
    null
  )

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

    // 延迟加载时间
    delaySecondsBeforeLoading: 0,

    // 对局来源
    matchHistorySource: 'lcu'
  })

  return {
    ongoingPlayers,
    ongoingGameInfo,
    ongoingTeams,
    ongoingPreMadeTeams,
    queryState,
    isInEndgamePhase,
    ongoingChampionSelections,
    isWaitingForDelay,

    ongoingPlayerAnalysis,

    settings,

    sendList
  }
})
