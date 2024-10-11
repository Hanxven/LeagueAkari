import { useTabs } from '@renderer-shared/compositions/useTabs'
import { SavedPlayerInfo } from '@renderer-shared/modules/core-functionality/store'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { Battle, BattleDetail } from '@shared/data-sources/tgp/types'

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

  /** 该玩家的TGP游戏信息 */
  battle: Battle

  /** 是否获取了TGP评分 */
  hasTgpScore: boolean

  /** 是否已经展开 */
  isExpanded: boolean
}

export interface SummonerTabMatchHistory {
  games: MatchHistoryGameTabCard[]

  /** 用于按照 ID 快速查找 */
  _gamesMap: Record<number, MatchHistoryGameTabCard>

  /** 上次拉取战绩的时间 */
  lastUpdate?: number

  /** 第几页，from 1 to Infinity */
  page: number

  /** 每页战绩的数量 */
  pageSize: number

  source: 'sgp' | 'lcu' | 'none'

  queueFilter: number | string
}

export interface TabState {
  /** 页面的 puuid */
  puuid: string

  /** 该玩家数据来源自哪个大区或 RSO */
  sgpServerId: string

  /** 召唤师信息需要加载 */
  summoner?: SummonerInfo

  /** 召唤师段位信息 */
  rankedStats?: RankedStats

  savedInfo?: SavedPlayerInfo

  /** 战绩列表细节 */
  matchHistory: SummonerTabMatchHistory

  detailedGamesCache: Map<number, Game>

  /** 缓存展开按钮获取的TGP评分 */
  detailedBattleCache: Map<number, BattleDetail>

  /** 加载中状态 */
  loading: {
    isLoadingSummoner: boolean
    isLoadingMatchHistory: boolean
    isLoadingRankedStats: boolean
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

  return {
    tabs,
    currentTab: current,
    addTab: add,
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
    closeAllTabs: closeAll
  }
})
