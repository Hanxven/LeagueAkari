import { defineStore } from 'pinia'
import { reactive } from 'vue'

export type PrintRules = Record<
  string,
  {
    stopHandle: Function | null
    enabled: boolean
  }
>

// 有关各种功能的设置项
export const useSettingsStore = defineStore('settings', () => {
  const app = reactive({
    autoConnect: true,
    autoCheckUpdates: true,
    fixWindowMethodAOptions: {
      baseWidth: 1600,
      baseHeight: 900
    }
  })

  // 调试功能的打印事件
  const debug = reactive({
    printAllLcuEvents: false,
    printRules: {} as PrintRules
  })

  // 战绩加载功能
  const matchHistory = reactive({
    fetchCount: 10,
    fetchFullGame: false,
    fetchAfterGame: true,
    autoRouteOnGameStart: true,

    // 用于判断预组队的阈值
    preMadeTeamThreshold: 3,

    // 为了判断预组队而进行的每名玩家提前加载的数量
    teamAnalysisPreloadCount: 4,

    // 是否拉取页面的所有详细对局
    fetchDetailedGame: false,

    matchHistoryLoadCount: 20,
    /**
     * 实验性特性，暂未实装。用于控制在拉取战绩时，的瞬时并发量
     *
     * 过高的并发可能导致失败
     *
     * 需要注意的是，需要考虑服务器的 QPS 限制。短时间内的大量请求会导致 503，因此直接查询所有玩家的游戏详情是困难的
     *
     * 举例，如果要查询五名玩家近 20 场的战绩详情，那么需要瞬间进行 115+ 次请求，很容易触发限制
     */
    maxConcurrency: 100
  })

  const autoAccept = reactive({
    enabled: false,
    delaySeconds: 0 // 0 代表不延迟，不会有任何计时器
  })

  const autoReply = reactive({
    enabled: false,
    enableOnAway: false,
    text: '' // 0 代表不延迟，不会有任何计时器
  })

  const autoSelect = reactive({
    normalModeEnabled: false,

    onlySimulMode: true,

    // 普遍自动选择时，英雄的 ID
    championId: 1,

    // 是否立即秒选
    completed: false,

    // 如大乱斗
    benchModeEnabled: false,

    benchExpectedChampions: [] as number[],

    grabDelay: 1,

    // 自动 ban
    banEnabled: false,

    // 自动 ban 的英雄 ID
    banChampionId: 1
  })

  const lobby = reactive({
    autoStart: false, // 是否启用人齐自动开始匹配
    autoStartDelay: 0 // 自动开始匹配的延迟
  })

  // TODO 未实装
  const chat = reactive({
    autoReplyWhenAway: false, // 在离开游戏时，是否自动回复
    autoReplyMessage: '' // 如果开启自动回复，那么回复的内容是什么
  })

  return {
    app,
    debug,
    matchHistory,
    autoAccept,
    lobby,
    chat,
    autoReply,
    autoSelect
  }
})
