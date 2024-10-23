import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { EMPTY_PUUID } from '@shared/constants/common'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide,
  analyzeMatchHistory,
  analyzeTeamMatchHistory
} from '@shared/utils/analysis'
import { calculateTogetherTimes, removeOverlappingSubsets } from '@shared/utils/team-up-calc'
import { comparer, computed, toJS } from 'mobx'
import PQueue from 'p-queue'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SavedPlayerMain } from '../saved-player'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { SgpMain } from '../sgp'
import { OngoingGameSettings, OngoingGameState } from './state'

/**
 * 用于游戏过程中的对局分析, 包括在此期间的战绩查询, 计算等
 */
export class OngoingGameMain implements IAkariShardInitDispose {
  static id = 'ongoing-game-main'
  static dependencies = [
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main',
    'akari-ipc-main',
    'mobx-utils-main',
    'sgp-main',
    'saved-player-main'
  ]

  static LOADING_PRIORITY = {
    SUMMONER: 1,
    MATCH_HISTORY: 2,
    SAVED_INFO: 3,
    RANKED_STATS: 4,
    CHAMPION_MASTERY: 5
  }

  /**
   * 目前已知的可用队列, 这是为了避免查询不支持队列时返回为空的情况
   */
  static SAFE_QUEUES = new Set([
    `q_420`,
    `q_430`,
    `q_440`,
    `q_450`, // ARAM
    `q_490`,
    `q_900`, // URF
    `q_1400`, // ULTBOOK
    `q_1700`,
    `q_1900`
  ])

  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _lc: LeagueClientMain
  private readonly _setting: MobxSettingService
  private readonly _mobx: MobxUtilsMain
  private readonly _ipc: AkariIpcMain
  private readonly _sgp: SgpMain
  private readonly _saved: SavedPlayerMain

  public readonly settings = new OngoingGameSettings()
  public readonly state: OngoingGameState

  /** 为**加载战绩**设置的特例 */
  private readonly _mhQueue = new PQueue()
  /** 为**加载战绩**设置的特例 */
  private _mhController: AbortController | null = null

  /**
   * 其他 API 的并发控制
   */
  private readonly _queue = new PQueue()
  private _controller: AbortController | null = null

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(OngoingGameMain.id)
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._settingFactory = deps['setting-factory-main']
    this._sgp = deps['sgp-main']
    this._saved = deps['saved-player-main']
    this._setting = this._settingFactory.create(
      OngoingGameMain.id,
      {
        concurrency: { default: this.settings.concurrency },
        enabled: { default: this.settings.enabled },
        matchHistoryLoadCount: { default: this.settings.matchHistoryLoadCount },
        orderPlayerBy: { default: this.settings.orderPlayerBy },
        preMadeTeamThreshold: { default: this.settings.preMadeTeamThreshold },
        matchHistoryUseSgpApi: { default: this.settings.matchHistoryUseSgpApi }
      },
      this.settings
    )
    this.state = new OngoingGameState(this._lc.data)
  }

  private async _handleState() {
    await this._setting.applyToState()
    this._mobx.propSync(OngoingGameMain.id, 'settings', this.settings, [
      'concurrency',
      'enabled',
      'matchHistoryLoadCount',
      'orderPlayerBy',
      'preMadeTeamThreshold',
      'matchHistoryUseSgpApi'
    ])
    this._mobx.propSync(OngoingGameMain.id, 'state', this.state, [
      'championSelections',
      'gameInfo',
      'positionAssignments',
      'premadeTeams',
      'queryStage',
      'teams',
      'matchHistoryTag'
    ])
  }

  async onInit() {
    await this._handleState()
    this._handlePQueue()
    this._handleLoad()
    this._handleIpcCall()
    this._handleCalculation()
  }

  private _handlePQueue() {
    this._mhQueue.on('active', () => {
      this._log.debug(
        `更新队列: 并发=${this._mhQueue.concurrency}, 当前数量=${this._mhQueue.size}, 等待中=${this._mhQueue.pending}`
      )
    })

    this._queue.on('active', () => {
      this._log.debug(
        `更新队列: 并发=${this._mhQueue.concurrency}, 当前数量=${this._mhQueue.size}, 等待中=${this._mhQueue.pending}`
      )
    })

    this._mobx.reaction(
      () => this.settings.concurrency,
      (concurrency) => {
        this._mhQueue.concurrency = concurrency
        this._queue.concurrency = concurrency
      },
      { fireImmediately: true }
    )
  }

  private _handleLoad() {
    this._mobx.reaction(
      () => this.state.queryStage,
      (stage) => {
        // 设计时, 必须保证加载流程是完全可控的
        // 阶段切换会立即取消之前的请求, 虽然在大部分情况下无需这么做
        if (this._controller) {
          this._controller.abort()
          this._controller = null
        }

        if (this._mhController) {
          this._mhController.abort()
          this._mhController = null
        }

        if (stage.phase === 'unavailable') {
          this.state.clear()
          this.state.setMatchHistoryTag(null)
          this._ipc.sendEvent(OngoingGameMain.id, 'clear')
          return
        }

        this._controller = new AbortController()
        this._mhController = new AbortController()

        if (this.state.queryStage.phase === 'champ-select') {
          this._champSelect({
            mhSignal: this._mhController.signal,
            signal: this._controller.signal
          })
        } else if (this.state.queryStage.phase === 'in-game') {
          this._inGame({
            mhSignal: this._mhController.signal,
            signal: this._controller.signal
          })
        }
      }
    )

    // 这些条件发生变化, 那么就会重新计算
    const unionQueryCondition = computed(
      () => {
        return {
          count: this.settings.matchHistoryLoadCount,
          tag: this.state.matchHistoryTag || undefined
        }
      },
      { equals: comparer.structural }
    )

    // 战绩重新加载条件
    this._mobx.reaction(
      () => unionQueryCondition.get(),
      (condition) => {
        if (this.state.queryStage.phase === 'unavailable') {
          return
        }

        if (this._mhController) {
          this._mhController.abort()
          this._mhController = null
        }

        const controller = new AbortController()
        this._mhController = controller

        const puuids = this.getPuuidsToLoadForPlayers()
        puuids.forEach((puuid) => {
          this._loadPlayerMatchHistory(puuid, {
            signal: controller.signal,
            count: condition.count,
            tag: condition.tag
          })
        })
      },
      { delay: 1000 }
    )
  }

  private _champSelect(options: { mhSignal: AbortSignal; signal: AbortSignal }) {
    const { mhSignal, signal } = options

    const puuids = this.getPuuidsToLoadForPlayers()
    puuids.forEach((puuid) => {
      // 别忘了tag
      this._loadPlayerMatchHistory(puuid, { signal: mhSignal })
      this._loadPlayerSummoner(puuid, { signal })
      this._loadPlayerRankedStats(puuid, { signal })
      this._loadPlayerSavedInfo(puuid, { signal })
      this._loadPlayerChampionMasterys(puuid, { signal })
    })
  }

  private _inGame(options: { mhSignal: AbortSignal; signal: AbortSignal }) {
    const { mhSignal, signal } = options

    const puuids = this.getPuuidsToLoadForPlayers()
    puuids.forEach((puuid) => {
      this._loadPlayerMatchHistory(puuid, { signal: mhSignal })
      this._loadPlayerSummoner(puuid, { signal })
      this._loadPlayerRankedStats(puuid, { signal })
      this._loadPlayerSavedInfo(puuid, { signal })
      this._loadPlayerChampionMasterys(puuid, { signal })
    })
  }

  private getPuuidsToLoadForPlayers() {
    if (this.state.queryStage.phase === 'unavailable') {
      return []
    }

    if (this.state.queryStage.phase === 'champ-select') {
      const session = this._lc.data.champSelect.session
      if (!session) {
        return []
      }

      const m = session.myTeam.filter((p) => p.puuid && p.puuid !== EMPTY_PUUID).map((t) => t.puuid)

      const t = session.theirTeam
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .map((t) => t.puuid)

      return [...m, ...t]
    } else if (this.state.queryStage.phase === 'in-game') {
      const session = this._lc.data.gameflow.session

      if (!session) {
        return []
      }

      const m = session.gameData.teamOne
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .map((t) => t.puuid)

      const t = session.gameData.teamTwo
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .map((t) => t.puuid)

      return [...m, ...t]
    }

    return []
  }

  private async _loadPlayerMatchHistory(
    puuid: string,
    options: {
      signal?: AbortSignal
      tag?: string
      count?: number
    } = {}
  ) {
    const isAbleToUseSgpApi =
      this.settings.matchHistoryUseSgpApi &&
      this._sgp.state.availability.serversSupported.matchHistory

    let { count = 20, signal, tag } = options

    if (isAbleToUseSgpApi) {
      // SGP API 可以筛选战绩
      // 在未设置筛选条件的情况下, 会根据设置的偏好来决定是否筛选
      if (tag === undefined) {
        if (this.settings.matchHistoryQueuePreference === 'all') {
          tag = undefined
        } else if (
          this.settings.matchHistoryQueuePreference === 'current' &&
          this.state.queryStage.gameInfo &&
          OngoingGameMain.SAFE_QUEUES.has(`q_${this.state.queryStage.gameInfo.queueId}`)
        ) {
          tag = `q_${this.state.queryStage.gameInfo.queueId}`
        }
      } else {
        // 对于已经设置 tag 偏好的情况, 会检测是否是安全队列, 否则重置
        if (!OngoingGameMain.SAFE_QUEUES.has(tag)) {
          tag = undefined
        }
      }

      const data = await this._mhQueue
        .add(() => this._sgp.getMatchHistoryLcuFormat(puuid, 0, count, tag), {
          signal,
          priority: OngoingGameMain.LOADING_PRIORITY.MATCH_HISTORY
        })
        .catch((error) => this._handleAbortError(error))

      if (!data) {
        return
      }

      const toBeLoaded = {
        data: data.games.games,
        targetCount: count,
        source: 'sgp' as 'sgp' | 'lcu',
        tag
      }

      this.state.matchHistory[puuid] = toBeLoaded
      this._ipc.sendEvent(OngoingGameMain.id, 'match-history-loaded', puuid, toBeLoaded)
    } else {
      const res = await this._queue
        .add(() => this._lc.api.matchHistory.getMatchHistory(puuid, 0, count - 1), {
          signal,
          priority: OngoingGameMain.LOADING_PRIORITY.MATCH_HISTORY
        })
        .catch((error) => this._handleAbortError(error))

      if (!res) {
        return
      }

      const data = res.data

      const toBeLoaded = {
        data: data.games.games,
        targetCount: count,
        source: 'lcu' as 'sgp' | 'lcu'
      }

      this.state.matchHistory[puuid] = toBeLoaded
      this._ipc.sendEvent(OngoingGameMain.id, 'match-history-loaded', puuid, toBeLoaded)
    }
  }

  private async _loadPlayerSummoner(
    puuid: string,
    options: {
      signal?: AbortSignal
    } = {}
  ) {
    const { signal } = options

    const res = await this._queue
      .add(() => this._lc.api.summoner.getSummonerByPuuid(puuid), {
        signal,
        priority: OngoingGameMain.LOADING_PRIORITY.SUMMONER
      })
      .catch((error) => this._handleAbortError(error))

    if (!res) {
      return
    }

    const data = res.data

    const toBeLoaded = { data, source: 'lcu' as 'sgp' | 'lcu' }
    this.state.summoner[puuid] = toBeLoaded
    this._ipc.sendEvent(OngoingGameMain.id, 'summoner-loaded', puuid, toBeLoaded)
  }

  private async _loadPlayerSavedInfo(
    puuid: string,
    options: {
      signal?: AbortSignal
    } = {}
  ) {
    // just used to suppress ts error
    if (!this._lc.state.auth || !this._lc.data.summoner.me) {
      return
    }

    const query = {
      puuid,
      selfPuuid: this._lc.data.summoner.me.puuid,
      region: this._lc.state.auth.region,
      rsoPlatformId: this._lc.state.auth.rsoPlatformId
    }

    const { signal } = options
    const res = await this._queue
      .add(() => this._saved.querySavedPlayerWithGames(query), {
        signal,
        priority: OngoingGameMain.LOADING_PRIORITY.SAVED_INFO
      })
      .catch((error) => this._handleAbortError(error))

    if (!res) {
      return
    }

    this.state.savedInfo[puuid] = res
    this._ipc.sendEvent(OngoingGameMain.id, 'saved-info-loaded', puuid, res)
  }

  private async _loadPlayerRankedStats(
    puuid: string,
    options: {
      signal?: AbortSignal
    } = {}
  ) {
    const { signal } = options

    const res = await this._mhQueue
      .add(() => this._lc.api.ranked.getRankedStats(puuid), {
        signal,
        priority: OngoingGameMain.LOADING_PRIORITY.RANKED_STATS
      })
      .catch((error) => this._handleAbortError(error))

    if (!res) {
      return
    }

    const data = res.data

    const toBeLoaded = { data, source: 'lcu' as 'sgp' | 'lcu' }
    this.state.rankedStats[puuid] = toBeLoaded
    this._ipc.sendEvent(OngoingGameMain.id, 'ranked-stats-loaded', puuid, toBeLoaded)
  }

  private async _loadPlayerChampionMasterys(
    puuid: string,
    options: {
      signal?: AbortSignal
    } = {}
  ) {
    const { signal } = options

    const res = await this._mhQueue
      .add(() => this._lc.api.championMastery.getPlayerChampionMastery(puuid), {
        signal,
        priority: OngoingGameMain.LOADING_PRIORITY.CHAMPION_MASTERY
      })
      .catch((error) => this._handleAbortError(error))

    if (!res) {
      return
    }

    const data = res.data

    const simplifiedMastery = data
      .map((m) => ({
        championId: m.championId,
        championLevel: m.championLevel,
        championPoints: m.championPoints,
        milestoneGrades: m.milestoneGrades
      }))
      .reduce((obj, cur) => {
        obj[cur.championId] = cur
        return obj
      }, {} as any)

    const toBeLoaded = { data: simplifiedMastery, source: 'lcu' as 'sgp' | 'lcu' }
    this.state.championMastery[puuid] = toBeLoaded
    this._ipc.sendEvent(OngoingGameMain.id, 'champion-mastery-loaded', puuid, toBeLoaded)
  }

  private _handleIpcCall() {
    this._ipc.onCall(OngoingGameMain.id, 'getAll', () => {
      const matchHistory = toJS(this.state.matchHistory)
      const summoner = toJS(this.state.summoner)
      const rankedStats = toJS(this.state.rankedStats)
      const savedInfo = toJS(this.state.savedInfo)

      return { matchHistory, summoner, rankedStats, savedInfo }
    })

    this._ipc.onCall(OngoingGameMain.id, 'setMatchHistoryTag', (tag: string) => {
      if (OngoingGameMain.SAFE_QUEUES.has(tag)) {
        this.state.setMatchHistoryTag(tag)
      }
    })
  }

  private _calcTeamUp() {
    if (!this.state.teams) {
      return null
    }

    const games = Object.values(this.state.matchHistory)
      .map((m) => m.data)
      .flat()

    if (!games.length) {
      return null
    }

    // 统计所有目前游戏中的每个队伍，并且将这些队伍分别视为一个独立的个体，使用 `${游戏ID}|${队伍ID}` 进行唯一区分
    const teamSides = new Map<string, string[]>()
    for (const game of games) {
      const mode = game.gameMode

      // participantId -> puuid
      const participantsMap = game.participantIdentities.reduce(
        (obj, current) => {
          obj[current.participantId] = current.player.puuid
          return obj
        },
        {} as Record<string, string>
      )

      let grouped: { teamId: number; puuid: string }[]

      // 对于竞技场模式，在战绩接口中只有一个队伍。如果要区分小队，需要使用 subteamPlacement 或 subteamId 字段
      if (mode === 'CHERRY') {
        grouped = game.participants.map((p) => ({
          teamId: p.stats.subteamPlacement, // 取值范围是 1, 2, 3, 4, 这个实际上也是最终队伍排名
          puuid: participantsMap[p.participantId]
        }))
      } else {
        // 对于其他模式，按照两队式计算
        grouped = game.participants.map((p) => ({
          teamId: p.teamId,
          puuid: participantsMap[p.participantId]
        }))
      }

      // teamId -> puuid[]，这个记录的是这条战绩中的
      const teamPlayersMap = grouped.reduce(
        (obj, current) => {
          if (obj[current.teamId]) {
            obj[current.teamId].push(current.puuid)
          } else {
            obj[current.teamId] = [current.puuid]
          }
          return obj
        },
        {} as Record<string, string[]>
      )

      // sideId -> puuid[]，按照队伍区分。
      Object.entries(teamPlayersMap).forEach(([teamId, players]) => {
        const sideId = `${game.gameId}|${teamId}`
        if (teamSides.has(sideId)) {
          return
        }
        teamSides.set(sideId, players)
      })
    }

    const matches = Array.from(teamSides).map(([id /* sideId */, players]) => ({ id, players }))

    // key: teamSide, values: { players: string[], times: number }[]
    const result = Object.entries(this.state.teams).reduce(
      (obj, [team, teamPlayers]) => {
        obj[team] = calculateTogetherTimes(matches, teamPlayers, this.settings.preMadeTeamThreshold)

        return obj
      },
      {} as Record<
        string,
        {
          players: string[]
          times: number
        }[]
      >
    )

    // teamSide -> players[][]
    const combinedGroups: Record<string, string[][]> = {}

    for (const [team, playerGroups] of Object.entries(result)) {
      const groups = playerGroups.map((pg) => pg.players)
      combinedGroups[team] = removeOverlappingSubsets(groups) as string[][]
    }

    return combinedGroups
  }

  private _calcAnalysis() {
    if (!this.state.teams) {
      return null
    }

    const playerAnalyses: Record<string, MatchHistoryGamesAnalysisAll> = {}

    for (const [puuid, matchHistory] of Object.entries(this.state.matchHistory)) {
      if (!matchHistory) {
        continue
      }

      const analysis = analyzeMatchHistory(
        matchHistory.data.map((mh) => ({ game: mh, isDetailed: true })), // for compatibility
        puuid
      )
      if (analysis) {
        playerAnalyses[puuid] = analysis
      }
    }

    const teamAnalyses: Record<string, MatchHistoryGamesAnalysisTeamSide> = {}

    for (const [sideId, puuids] of Object.entries(this.state.teams)) {
      const teamPlayerAnalyses = puuids.map((p) => playerAnalyses[p]).filter(Boolean)
      const teamAnalysis = analyzeTeamMatchHistory(teamPlayerAnalyses)
      if (teamAnalysis) {
        teamAnalyses[sideId] = teamAnalysis
      }
    }

    return {
      players: playerAnalyses,
      teams: teamAnalyses
    }
  }

  private _handleCalculation() {
    // 重新计算战绩信息
    this._mobx.reaction(
      () => Object.values(this.state.matchHistory),
      (_changedV) => {
        this.state.setPlayerStats(this._calcAnalysis())
      },
      { delay: 200, equals: comparer.shallow }
    )

    // 重新计算预组队
    this._mobx.reaction(
      () => [Object.values(this.state.matchHistory), this.settings.preMadeTeamThreshold] as const,
      ([_changedV, _threshold]) => {
        this.state.setPremadeTeams(this._calcTeamUp())
      },
      { delay: 200, equals: comparer.shallow }
    )
  }

  private _handleAbortError(e: any) {
    if (e instanceof Error && e.name === 'AbortError') {
      return
    }
    return Promise.reject(e)
  }
}
