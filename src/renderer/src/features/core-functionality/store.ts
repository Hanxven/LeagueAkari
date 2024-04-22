import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { defineStore } from 'pinia'
import { markRaw, reactive, ref, shallowRef } from 'vue'

import { useTabs } from '@renderer/compositions/useTabs'

import { fetchTabFullData } from '.'

export const id = 'store:match-history'

/**
 * 通用带状态的战绩数据
 */

/**
 * 仅用于适合标签页中带有展开属性的卡片
 */
export interface MatchHistoryGameTabCard {
  isLoading: boolean

  /** 是否是加载后的详细对局信息 */
  isDetailed: boolean

  /**
   * 是否加载出错
   */
  hasError?: boolean

  /** 游戏对局信息本体 */
  game: Game

  /** 是否已经展开 */
  isExpanded: boolean
}

/**
 * 存储在本地的玩家信息
 */
export interface SavedPlayerInfo {
  summonerId: number

  selfSummonerId: number

  tag: string

  updateAt: Date

  lastMetAt: Date

  region: string

  rsoPlatformId: string

  encounteredGames: number[]
}

export interface OngoingPlayer {
  // 当前的召唤师 ID，和 key 值相同
  summonerId: number

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
  matchHistory?: MatchHistoryWithState[]

  /**
   * 记录的玩家信息
   */
  savedInfo?: SavedPlayerInfo
}

export interface MatchHistoryWithState {
  game: Game
  isDetailed: boolean
}

/**
 * ranked-stats-ready summonerId, data
 * match-history-ready summonerId, data
 * champion-id-updated summonerId, championId
 * saved-info-ready summonerId, data
 * order-updated summonerId, orderId
 * team-updated summonerId, teamId
 */

export interface SummonerTabMatchHistory {
  games: MatchHistoryGameTabCard[]

  /** 用于按照 ID 快速查找 */
  gamesMap: Record<number, MatchHistoryGameTabCard>

  /** 上次拉取战绩的时间 */
  lastUpdate?: number

  /** 请求的战绩是否为空，区分未加载和加载为空的情况 */
  isEmpty: boolean

  /** 是否请求出错 */
  hasError: boolean

  /** 第几页，from 1 to Infinity */
  page: number

  /** 每页战绩的数量 */
  pageSize: number
}

export interface TabState {
  /** 页面 ID，目前是召唤师 ID */
  id: number

  /** 召唤师信息需要加载 */
  summoner?: SummonerInfo

  /** 召唤师段位信息 */
  rankedStats?: RankedStats

  savedInfo?: SavedPlayerInfo

  /** 战绩列表细节 */
  matchHistory: SummonerTabMatchHistory

  detailedGamesCache: Map<number, Game>

  /** 加载中状态 */
  loading: {
    isLoadingSummoner: boolean
    isLoadingMatchHistory: boolean
    isLoadingRankedStats: boolean
  }

  /**
   * 记录页面的滚动位置
   */
  scrollPosition: {
    x: number
    y: number
  }
}

const DEFAULT_DETAILED_GAMES_CACHE_LIMIT = 200

/** 和战绩相关的一切基础功能 store */
export const useCoreFunctionalityStore = defineStore('feature:core-functionality', () => {
  const {
    add,
    canCloseAllTemporary,
    canCloseCurrent,
    canCloseOther,
    closeAllTemporary,
    closeAll,
    closeOther,
    current,
    del,
    get,
    move,
    setCurrent,
    setPinned,
    setTemporary,
    tabs
  } = useTabs<TabState>()

  const isLoadingTab = (id: number) => {
    const tab = get(id)
    if (tab) {
      return (
        tab.data.loading.isLoadingMatchHistory ||
        tab.data.loading.isLoadingRankedStats ||
        tab.data.loading.isLoadingSummoner
      )
    }
    return false
  }

  /** 创建一个新的 Tab 并自动进行初始化操作 */
  const createTab = (
    id: number,
    options: { setCurrent?: boolean; pin?: boolean; temporary?: boolean } = {}
  ) => {
    const tab = get(id)
    if (tab) {
      if (options.setCurrent) {
        setCurrent(id)
      }
      return
    }

    const newTab = {
      id: id,
      matchHistory: {
        games: [],
        gamesMap: {},
        page: 1,
        pageSize: 20,
        isEmpty: false,
        hasError: false,
        lastUpdate: Date.now()
      },
      detailedGamesCache: markRaw(new Map()),
      loading: {
        isLoadingSummoner: false,
        isLoadingMatchHistory: false,
        isLoadingRankedStats: false
      },
      scrollPosition: {
        x: 0,
        y: 0
      }
    } as TabState

    add(id, newTab, options)

    if (options.setCurrent) {
      setCurrent(id)
    }

    fetchTabFullData(id)
  }

  const setTabScrollPosition = (id: number, x: number, y: number) => {
    const tab = get(id)
    if (tab) {
      tab.data.scrollPosition = {
        x,
        y
      }
      return true
    }
    return false
  }

  const setMatchHistoryExpand = (summonerId: number, gameId: number, expand: boolean) => {
    const tab = get(summonerId)

    if (tab) {
      const match = tab.data.matchHistory.gamesMap[gameId]
      if (match) {
        // 出于性能考量，时刻保证只有一个元素展开
        // 目前同屏渲染压力太大了
        if (expand) {
          Object.entries(tab.data.matchHistory.gamesMap).forEach(([_, m]) => {
            if (m.isExpanded) {
              m.isExpanded = false
            }
          })
        }

        match.isExpanded = expand
      }
    }
  }

  const ongoingPlayers = ref<
    Record<
      number | string, // summonerId
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

  const ongoingState = ref<'unavailable' | 'in-game' | 'champ-select'>('unavailable')
  const ongoingTeams = shallowRef<Record<string, number[]> | null>(null)
  const isInEndgamePhase = ref(false)
  const ongoingChampionSelections = shallowRef<Record<string | number, number> | null>(null)

  // 战绩加载功能
  const settings = reactive({
    fetchAfterGame: true,
    autoRouteOnGameStart: true,

    // 用于判断预组队的阈值
    preMadeTeamThreshold: 3,

    // 为了判断预组队而进行的每名玩家提前加载的数量
    teamAnalysisPreloadCount: 4,

    // 是否拉取页面的所有详细对局
    fetchDetailedGame: false,

    // 拉取分页大小
    matchHistoryLoadCount: 40,

    // 允许在游戏内发送对局 KDA 信息
    sendKdaInGame: false,

    // 预组队信息
    sendKdaInGameWithPreMadeTeams: true,

    // 发送 KDA 信息需保证 KDA 大于此值
    sendKdaThreshold: 0
  })

  return {
    tabs,
    currentTab: current,
    createTab,
    getTab: get,
    closeTab: del,
    moveTab: move,
    setTabPinned: setPinned,
    setTabTemporary: setTemporary,
    setCurrentTab: setCurrent,
    canCloseAllTemporaryTab: canCloseAllTemporary,
    canCloseOtherTabs: canCloseOther,
    canCloseCurrentTab: canCloseCurrent,
    closeOtherTabs: closeOther,
    closeAllTemporaryTabs: closeAllTemporary,
    closeAllTabs: closeAll,

    isLoading: isLoadingTab,
    setMatchHistoryExpand,
    setScrollPosition: setTabScrollPosition,

    /** ongoing game 相关 */
    ongoingPlayers,
    ongoingGameInfo,
    ongoingTeams,
    ongoingPreMadeTeams,
    ongoingState,
    isInEndgamePhase,
    ongoingChampionSelections,

    settings,

    /** KDA 发送信息相关  */
    sendList
  }
})
