import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'

import { useTabs } from '@renderer/compositions/useTabs'
import { Game } from '@renderer/types/match-history'
import { RankedStats } from '@renderer/types/ranked'
import { SummonerInfo } from '@renderer/types/summoner'
import { LruMap } from '@renderer/utils/collection'

import { fetchTabFullData } from '../match-history'

export const id = 'store:match-history'

/**
 * 通用带状态的战绩数据
 */
export interface MatchHistoryGame {
  /** 战绩是否加载中，通常用于加载详细对局信息 */
  isLoading: boolean

  /** 是否是加载后的详细对局信息 */
  isDetailed: boolean

  /**
   * 是否加载出错
   */
  hasError?: boolean

  /** 游戏对局信息本体 */
  game: Game
}

/**
 * 仅用于适合标签页中带有展开属性的卡片
 */
export interface MatchHistoryGameTabCard extends MatchHistoryGame {
  // 战绩卡片是否展开中
  isExpanded: boolean
}

export interface OngoingTeamPlayer {
  id: number

  /**
   * 所属队伍，100 蓝，200 红，对于竞技场，使用 1 ~ 4。
   * 注意它和 teamId 有点区别，teamId 是 LCU 表达阵营的方式之一，而 team 只是用于软件内部区分阵营的类似属性（虽然它的值应该和 teamId 差不多）
   */
  team?: string

  /** 队伍中的顺序 */
  order?: number

  /** 召唤师信息缓存 */
  summoner?: SummonerInfo

  /** 玩家的段位信息 */
  rankedStats?: RankedStats

  /** 用于分析的战绩列表 */
  matchHistory?: MatchHistoryGame[]

  /** 当前选择的英雄 */
  championId?: number

  savedInfo?: SavedTaggedPlayer
}

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

  /** 战绩列表细节 */
  matchHistory: SummonerTabMatchHistory

  detailedGamesCache: LruMap<number, Game>

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

export interface SavedTaggedPlayer {
  id: number

  tag: string

  relatedGameIds: number[]

  updateAt: Date

  lastMet: Date

  side: 'teammate' | 'opponent'

  summonerInfo: SummonerInfo
}

const DEFAULT_DETAILED_GAMES_CACHE_LIMIT = 200

/** 和战绩相关的一切基础功能 store */
export const useMatchHistoryStore = defineStore('match-history', () => {
  const {
    add,
    canCloseAllTemporary,
    canCloseCurrent,
    canCloseOther,
    closeAllTemporary,
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
      detailedGamesCache: markRaw(new LruMap(DEFAULT_DETAILED_GAMES_CACHE_LIMIT)),
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
      OngoingTeamPlayer
    >
  >({})

  const ongoingGame = ref<{
    queueType: string // 当前的游戏相关信息
    gameId: number
  } | null>(null)

  const ongoingDetailedGamesCache = ref<Record<number | string, Game>>({})

  const ongoingPreMadeTeams = ref<
    Record<
      string,
      {
        players: number[]
        times: number
      }[]
    >
  >({})

  const ongoingPreMadeTeamsSimplifiedArray = ref<
    {
      players: number[]
      times: number
      team: string
      _id: number
    }[]
  >([])

  const sendPlayers = ref<Record<string | number, boolean>>({})

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

    isLoading: isLoadingTab,
    setMatchHistoryExpand,
    setScrollPosition: setTabScrollPosition,

    /** ongoing game 相关 */
    ongoingPlayers,
    ongoingGame,
    ongoingDetailedGamesCache,
    ongoingPreMadeTeams,
    ongoingPreMadeTeamsSimplifiedArray,

    /** KDA 发送信息相关  */
    sendPlayers
  }
})
