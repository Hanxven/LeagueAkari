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

    // 发送 KDA 信息需保证 KDA 大于此值
    sendKdaThreshold: 0,

    // 在后面附加免责声明
    sendKdaInGameWithDisclaimer: true,
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

    expectedChampions: [] as number[],

    // 自动选择的时候是否避开队友预选
    selectTeammateIntendedChampion: false,

    selectRandomly: false,

    // 是否立即秒选
    completed: false,

    // 如大乱斗
    benchModeEnabled: false,

    benchExpectedChampions: [] as number[],

    // 是否在聊天室进行提示
    benchActionNotifyInChat: true,

    // 选择的延迟，单位秒
    grabDelay: 1,

    // 自动 ban
    banEnabled: false,

    bannedChampions: [] as number[],

    banRandomly: false,

    // ban 的时候是否考虑队友预选
    banTeammateIntendedChampion: false
  })

  const lobby = reactive({
    autoStart: false, // 是否启用人齐自动开始匹配
    autoStartDelay: 0 // 自动开始匹配的延迟
  })

  const autoPerk = reactive({})

  return {
    app,
    debug,
    matchHistory,
    autoAccept,
    lobby,
    autoReply,
    autoSelect,
    autoPerk
  }
})
