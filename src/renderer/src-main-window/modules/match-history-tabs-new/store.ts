import { useTabs } from '@shared/renderer/compositions/useTabs'
import { SavedPlayerInfo } from '@shared/renderer/modules/core-functionality-new/store'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { defineStore } from 'pinia'
import { markRaw } from 'vue'

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
  /** 页面的 puuid */
  puuid: string

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
/** 和战绩相关的一切基础功能 store */
export const useMatchHistoryTabsStore = defineStore('module:match-history-tabs', () => {
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

  const isLoadingTab = (puuid: string) => {
    const tab = get(puuid)
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
    puuid: string,
    options: { setCurrent?: boolean; pin?: boolean; temporary?: boolean } = {}
  ) => {
    const tab = get(puuid)
    if (tab) {
      if (options.setCurrent) {
        setCurrent(puuid)
      }
      return
    }

    const newTab = {
      puuid,
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

    add(puuid, newTab, options)

    if (options.setCurrent) {
      setCurrent(puuid)
    }
  }

  const setTabScrollPosition = (puuid: string, x: number, y: number) => {
    const tab = get(puuid)
    if (tab) {
      tab.data.scrollPosition = {
        x,
        y
      }
      return true
    }
    return false
  }

  const setMatchHistoryExpand = (puuid: string, gameId: number, expand: boolean) => {
    const tab = get(puuid)

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
    setScrollPosition: setTabScrollPosition
  }
})
