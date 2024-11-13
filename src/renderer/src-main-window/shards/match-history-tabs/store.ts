import { PlayerTagDto } from '@renderer-shared/shards/saved-player'
import { SpectatorData } from '@shared/data-sources/sgp/types'
import { Game } from '@shared/types/league-client/match-history'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo, SummonerProfile } from '@shared/types/league-client/summoner'
import { defineStore } from 'pinia'
import QuickLRU from 'quick-lru'
import { computed, ref, shallowReactive } from 'vue'

/**
 * 通用带状态的战绩数据
 */

/**
 * 仅用于适合标签页中带有展开属性的卡片
 */
export interface GameDataState {
  isLoading: boolean

  /** 是否是加载后的详细对局信息 */
  isDetailed: boolean

  /**
   * 是否加载出错
   */
  hasError: boolean

  /** 游戏对局信息本体, should be marked raw */
  game: Game

  /** 是否已经展开 */
  isExpanded: boolean
}

export interface MatchHistoryPage {
  games: GameDataState[]

  /** 上次拉取战绩的时间 */
  lastUpdate?: number

  /** 从 1 开始 */
  page: number

  /** 不得超过 200, 不得低于 1 */
  pageSize: number

  source: 'sgp' | 'lcu'

  /** 'all' 为所有队列, 如果战机源为 LCU, 则一定为 all */
  tag: string
}

// copied from main shard
export interface SavedPlayer {
  encounteredGames: EncounteredGame[]
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  tag: string | null
  updateAt: Date
  lastMetAt: Date | null
}

// copied from main shard
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

export interface TabState {
  id: string

  /** 页面的 puuid */
  puuid: string

  /** 该玩家数据来源自哪个大区或 RSO */
  sgpServerId: string

  /** 召唤师信息需要加载 */
  summoner: SummonerInfo | null

  /** 召唤师段位信息 */
  rankedStats: RankedStats | null

  /** 保存的召唤师信息 */
  savedInfo: SavedPlayer | null

  /** 当前战绩页 */
  matchHistoryPage: MatchHistoryPage | null

  /** 观战信息 */
  spectatorData: SpectatorData | null

  summonerProfile: SummonerProfile | null

  /** 标记信息 */
  tags: PlayerTagDto[]

  // 加载状态
  isLoadingSummoner: boolean
  isLoadingRankedStats: boolean
  isLoadingMatchHistory: boolean
  isLoadingSpectatorData: boolean
  isLoadingTags: boolean
  isLoadingSavedInfo: boolean
  isLoadingSummonerProfile: boolean

  isTakingScreenshot: boolean
}

/** 声明到全局状态, 以减少状态管理的复杂度 */
export const useMatchHistoryTabsStore = defineStore('shard:match-history-tabs-renderer', () => {
  const settings = shallowReactive({
    /**
     *  游戏结束后刷新涉及到的页面卡
     */
    refreshTabsAfterGameEnds: true,

    /**
     * 优先使用 SGP API 查询战绩
     */
    matchHistoryUseSgpApi: true
  })

  const tabs = ref<TabState[]>([])
  const currentTabId = ref<string | null>(null)

  const currentTab = computed(() => {
    return tabs.value.find((t) => t.id === currentTabId.value) || null
  })

  const closeTab = (id: string) => {
    // 删除 tab, 并切换到右边的 tab (如果有), 否则切换到左边的 tab
    const index = tabs.value.findIndex((t) => t.id === id)
    if (index === -1) {
      return
    }

    tabs.value = tabs.value.filter((t) => t.id !== id)

    const setCurrentIndex = Math.min(index, tabs.value.length - 1)
    if (setCurrentIndex >= 0) {
      currentTabId.value = tabs.value[setCurrentIndex].id
    } else {
      currentTabId.value = null
    }
  }

  const setCurrentTab = (id: string) => {
    if (tabs.value.some((t) => t.id === id)) {
      currentTabId.value = id
    }
  }

  const createTab = (data: TabState, setCurrent = true) => {
    if (tabs.value.some((t) => t.id === data.id)) {
      return
    }

    if (setCurrent) {
      currentTabId.value = data.id
    }

    tabs.value.push(data)
  }

  const getTab = (id: string) => {
    return tabs.value.find((t) => t.id === id)
  }

  const getTabByPuuid = (puuid: string) => {
    return tabs.value.find((t) => t.puuid === puuid)
  }

  const moveTabBefore = (fromTabId: string, toTabId: string) => {
    if (fromTabId === toTabId) {
      return
    }

    const fromIndex = tabs.value.findIndex((t) => t.id === fromTabId)
    const toIndex = tabs.value.findIndex((t) => t.id === toTabId)

    if (fromIndex === -1 || toIndex === -1) {
      return
    }

    const updatedTabs = [...tabs.value]
    const [tab] = updatedTabs.splice(fromIndex, 1) // 移除 fromIndex 的元素

    updatedTabs.splice(toIndex, 0, tab)

    tabs.value = updatedTabs
  }

  const closeAllTabs = () => {
    tabs.value = []
    currentTabId.value = null
  }

  const closeOtherTabs = (centerId: string) => {
    tabs.value = tabs.value.filter((t) => t.id === centerId)
    currentTabId.value = centerId
  }

  const closeTabsToTheRight = (centerId: string) => {
    const index = tabs.value.findIndex((t) => t.id === centerId)
    if (index === -1) {
      return
    }

    tabs.value = tabs.value.slice(0, index + 1)

    if (!tabs.value.some((t) => t.id === currentTabId.value)) {
      currentTabId.value = tabs.value[tabs.value.length - 1].id
    }
  }

  const canCloseTabsToTheRight = (centerId: string) => {
    const index = tabs.value.findIndex((t) => t.id === centerId)
    return index !== -1 && index < tabs.value.length - 1
  }

  const canCloseOtherTabs = (centerId: string) => {
    return tabs.value.some((t) => t.id !== centerId)
  }

  /** 避免太多的加载, 在所有的页面中可以共享 */
  const detailedGameLruMap = new QuickLRU<number, Game>({ maxSize: 568 })

  return {
    settings,

    detailedGameLruMap,

    tabs,
    currentTabId,
    currentTab,

    closeTab,
    setCurrentTab,
    createTab,
    getTab,
    getTabByPuuid,
    closeAllTabs,
    closeOtherTabs,
    closeToTheRight: closeTabsToTheRight,
    canCloseOtherTabs,
    canCloseTabsToTheRight,
    moveTabBefore
  }
})
