import {
  MobxBasedBasicModule,
  RegisteredSettingHandler
} from '@main/akari-ipc/mobx-based-basic-module'
import { EncounteredGame } from '@main/db/entities/EncounteredGame'
import { SavedPlayer } from '@main/db/entities/SavedPlayers'
import { getPlayerChampionMastery } from '@main/http-api/champion-mastery'
import { chatSend } from '@main/http-api/chat'
import { getGame, getMatchHistory } from '@main/http-api/match-history'
import { getRankedStats } from '@main/http-api/ranked'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { EMPTY_PUUID } from '@shared/constants/common'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide,
  analyzeMatchHistory,
  analyzeTeamMatchHistory,
  getAnalysis,
  withSelfParticipantMatchHistory
} from '@shared/utils/analysis'
import { formatError } from '@shared/utils/errors'
import { summonerName } from '@shared/utils/name'
import { sleep } from '@shared/utils/sleep'
import { calculateTogetherTimes, removeOverlappingSubsets } from '@shared/utils/team-up-calc'
import { Paths } from '@shared/utils/types'
import dayjs from 'dayjs'
import { set } from 'lodash'
import { comparer, computed, observable, runInAction, toJS } from 'mobx'
import PQueue from 'p-queue'

import { ExternalDataSourceModule } from '../external-data-source'
import { LcuConnectionModule } from '../lcu-connection'
import { LcuSyncModule } from '../lcu-state-sync'
import { LeagueClientModule } from '../league-client'
import { AppLogger, LogModule } from '../log'
import { MainWindowModule } from '../main-window'
import { PlatformModule } from '../win-platform'
import { CoreFunctionalityState } from './state'
import { TgpApiModule } from '@main/modules/tgp-api'
import { Battle } from '@shared/data-sources/tgp/types'

export class CoreFunctionalityModule extends MobxBasedBasicModule {
  public state = new CoreFunctionalityState()

  static FETCH_PRIORITY = {
    SUMMONER_INFO: 97,
    MATCH_HISTORY: 89,
    RANKED_STATS: 83,
    CHAMPION_MASTERY: 79,
    GAME: 73
  } as const

  static QUEUE_FILTER_QUEUES = new Set([420, 430, 440, 450, 1700, 490, 1900, 900])

  static SEND_INTERVAL = 65

  private _controller: AbortController | null = null
  private _playerAnalysisFetchLimiter = new PQueue()

  private _logger: AppLogger
  private _lcm: LcuConnectionModule
  private _lcm2: LeagueClientModule
  private _lcu: LcuSyncModule
  private _pm: PlatformModule
  private _mwm: MainWindowModule
  private _edsm: ExternalDataSourceModule
  private _tam: TgpApiModule

  private _isSimulatingKeyboard = false

  private _tagSendQueuedPlayers = new Set<string>()
  private _tagRemindingQueue = new PQueue({
    interval: 100,
    intervalCap: 1,
    autoStart: false
  })

  constructor() {
    super('core-functionality')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('core-functionality')
    this._lcu = this.manager.getModule('lcu-state-sync')
    this._lcm = this.manager.getModule('lcu-connection')
    this._lcm2 = this.manager.getModule('league-client')
    this._mwm = this.manager.getModule('main-window')
    this._pm = this.manager.getModule('win-platform')
    this._edsm = this.manager.getModule('external-data-source')
    this._tam = this.manager.getModule('tgp-api')

    await this._setupSettings()
    this._setupStateSync()
    this._setupMethodCall()

    this._playerAnalysisFetchLimiter.concurrency =
      this.state.settings.playerAnalysisFetchConcurrency

    this._handleOngoingAnalyzing()
    this._handleSendInGame()
    this._handleSavePlayerInEndgame()
    this._handleTaggedPlayerReminder()
    this._handleLogging()

    this._logger.info('初始化完成')
  }

  private _handleLogging() {
    this.reaction(
      () => this.state.ongoingGameInfo,
      () => {
        this._logger.info(`当前游戏信息: ${JSON.stringify(toJS(this.state.ongoingGameInfo))}`)
      }
    )

    this.reaction(
      () => this.state.queryState,
      (s) => {
        this._logger.info(`当前对局分析查询阶段: ${JSON.stringify(s)}`)
      }
    )
  }

  private async _loadAllPlayers(
    state: typeof this.state.queryState,
    queueFilter: number,
    useSgpApi: boolean
  ) {
    if (this._controller) {
      this._controller.abort()
    }

    this._controller = new AbortController()

    let queueId: number | null = null

    // 定义 -10 为当前游戏队列 (如果支持)
    if (queueFilter === -10) {
      if (
        state.gameInfo &&
        CoreFunctionalityModule.QUEUE_FILTER_QUEUES.has(state.gameInfo.queueId)
      ) {
        queueId = state.gameInfo.queueId
      }
    } else if (queueFilter === -20) {
      // 定义为 -20 为当前队列
      queueId = null
    } else {
      if (CoreFunctionalityModule.QUEUE_FILTER_QUEUES.has(queueFilter)) {
        queueId = queueFilter
      }
    }

    try {
      if (state.phase === 'champ-select') {
        await this._champSelectQuery(this._controller.signal, queueId, useSgpApi)
      } else if (state.phase === 'in-game') {
        await this._inGameQuery(this._controller.signal, queueId, useSgpApi)
      }
    } catch (error) {
      this._mwm.notify.warn('core-functionality', '对局中', '无法加载对局中信息')
      this._logger.warn(`加载对局中信息时发生错误:  ${formatError(error)}, in ${state}`)
    }
  }

  private _handleOngoingAnalyzing() {
    this.reaction(
      () =>
        [
          this.state.queryState,
          this.state.settings.ongoingAnalysisEnabled,
          this.state.queueFilter,
          this.state.settings.useSgpApi
        ] as const,
      async ([state, s, queueFilter, useSgpApi]) => {
        if (state.phase === 'unavailable' || !s) {
          this.sendEvent('clear/ongoing-players')
          this.state.clearOngoingVars()
          if (this._controller) {
            this._controller.abort()
            this._controller = null
          }

          return
        }

        await this._loadAllPlayers(state, queueFilter, useSgpApi)
      },
      { equals: comparer.shallow, fireImmediately: true }
    )

    this.reaction(
      () =>
        [
          Array.from(this.state.tempDetailedGames.values()),
          Array.from(this.state.ongoingPlayers.values()).map((p) => p.summoner),
          this.state.ongoingTeams,
          this.state.queryState,
          this.state.settings.preMadeTeamThreshold
        ] as const,
      () => {
        const result = this._analyzeTeamUp()
        if (result && this.state.queryState.phase !== 'unavailable') {
          runInAction(() => (this.state.ongoingPreMadeTeams = result))
        } else {
          runInAction(() => (this.state.ongoingPreMadeTeams = {}))
        }
      },
      { delay: 100 }
    )

    // Akari's Opinion
    this.reaction(
      () =>
        [
          Array.from(this.state.tempDetailedGames.values()),
          Array.from(this.state.ongoingPlayers.values()).map((p) => p.matchHistory),
          this.state.ongoingTeams,
          this.state.queryState
        ] as const,
      ([_, __, teams, qs]) => {
        if (qs.phase === 'unavailable') {
          runInAction(() => (this.state.ongoingPlayerAnalysis = null))
          return
        }

        if (!teams) {
          return
        }

        const playerAnalyses: Record<string, MatchHistoryGamesAnalysisAll> = {}

        for (const [puuid, { matchHistory }] of this.state.ongoingPlayers.entries()) {
          if (!matchHistory) {
            continue
          }

          const analysis = analyzeMatchHistory(matchHistory, puuid)
          if (analysis) {
            playerAnalyses[puuid] = analysis
          }
        }

        const teamAnalyses: Record<string, MatchHistoryGamesAnalysisTeamSide> = {}

        for (const [sideId, playerPuuids] of Object.entries(teams)) {
          const teamPlayerAnalyses = playerPuuids.map((p) => playerAnalyses[p]).filter(Boolean)
          const teamAnalysis = analyzeTeamMatchHistory(teamPlayerAnalyses)
          if (teamAnalysis) {
            teamAnalyses[sideId] = teamAnalysis
          }
        }

        runInAction(() => {
          this.state.ongoingPlayerAnalysis = {
            players: playerAnalyses,
            teams: teamAnalyses
          }
        })
      },
      { delay: 500 }
    )
  }

  private _handleTaggedPlayerReminder() {
    this.reaction(
      () =>
        Array.from(this.state.ongoingPlayers.values()).map(
          (p) => [p.summoner, p.savedInfo] as const
        ),
      (si) => {
        for (const [s, t] of si) {
          if (!s || !t) {
            continue
          }

          if (this._tagSendQueuedPlayers.has(s.puuid)) {
            return
          }

          const task = async () => {
            if (this._lcu.chat.conversations.championSelect) {
              try {
                await chatSend(
                  this._lcu.chat.conversations.championSelect.id,
                  this._formatTagRemindingText(s, t),
                  'celebration'
                )
              } catch {
                this._logger.warn(`尝试发送 ${this._formatTagRemindingText(s, t)} 时失败`)
              }
            }
          }

          if (t.tag) {
            this._tagSendQueuedPlayers.add(s.puuid)
            this._tagRemindingQueue.add(task)
          }
        }
      },
      { delay: 50 }
    )

    this.reaction(
      () => this._lcu.chat.conversations.championSelect,
      (c) => {
        if (c) {
          this._tagRemindingQueue.start()
        } else {
          this._tagRemindingQueue.pause()
        }
      }
    )

    this.reaction(
      () => this.state.queryState,
      (s) => {
        if (s.phase === 'unavailable') {
          this._tagSendQueuedPlayers.clear()
          this._tagRemindingQueue.clear()
        }
      }
    )
  }

  private _formatTagRemindingText(
    summonerInfo: SummonerInfo,
    savedInfo: SavedPlayer & { encounteredGames: EncounteredGame[] }
  ) {
    const { gameName, tagLine } = summonerInfo
    if (savedInfo.lastMetAt) {
      const rt = dayjs(savedInfo.lastMetAt).locale('zh-cn').fromNow()
      return `[League Akari] 已标记的玩家 (${rt} 遇见) ${summonerName(gameName, tagLine)}: ${savedInfo.tag}`
    } else {
      return `[League Akari] 已标记的玩家 ${summonerName(gameName, tagLine)}: ${savedInfo.tag}`
    }
  }

  private _handleSavePlayerInEndgame() {
    const isEndGame = computed(
      () => this._lcu.gameflow.phase === 'EndOfGame' || this._lcu.gameflow.phase === 'PreEndOfGame'
    )

    // 在游戏结算时记录所有玩家到数据库
    this.reaction(
      () => isEndGame.get(),
      (is) => {
        if (is && this._lcu.gameflow.session && this._lcu.summoner.me && this._lcm.state.auth) {
          const t1 = this._lcu.gameflow.session.gameData.teamOne
          const t2 = this._lcu.gameflow.session.gameData.teamTwo

          const all = [...t1, ...t2].filter(
            (p) => p.puuid && p.puuid !== this._lcu.summoner.me?.puuid
          )

          const tasks = all.map(async (p) => {
            const task1 = this._sm.players.saveSavedPlayer({
              encountered: true,
              region: this._lcm.state.auth!.region,
              rsoPlatformId: this._lcm.state.auth!.rsoPlatformId,
              selfPuuid: this._lcu.summoner.me!.puuid,
              puuid: p.puuid
            })

            const task2 = this._sm.players.saveEncounteredGame({
              region: this._lcm.state.auth!.region,
              rsoPlatformId: this._lcm.state.auth!.rsoPlatformId,
              selfPuuid: this._lcu.summoner.me!.puuid,
              puuid: p.puuid,
              gameId: this._lcu.gameflow.session!.gameData.gameId,
              queueType: this.state.ongoingGameInfo?.queueType || ''
            })

            const r = await Promise.allSettled([task1, task2])
            if (r[0].status === 'fulfilled') {
              this._logger.info(`保存玩家信息: ${r[0].value.puuid}`)
            } else {
              this._logger.info(`无法保存玩家信息: ${formatError(r[0].reason)}`)
            }
            if (r[1].status === 'fulfilled') {
              this._logger.info(`保存游戏历史记录: ${r[1].value.puuid} ${r[1].value.gameId}`)
            } else {
              this._logger.info(`无法保存游戏历史记录: ${formatError(r[1].reason)}`)
            }
          })

          Promise.allSettled(tasks)
        }
      }
    )
  }

  private _handleSendInGame() {
    this.reaction(
      () => this.state.ongoingTeams,
      (teams) => {
        if (!teams) {
          return
        }

        for (const [_, players] of Object.entries(teams)) {
          for (const p of players) {
            if (this.state.sendList[p] === undefined) {
              this.state.sendList[p] = true
            }
          }
        }
      }
    )

    const sendOur = () => {
      if (this._isSimulatingKeyboard) {
        this._isSimulatingKeyboard = false
        return
      }

      if (this.state.queryState.phase === 'in-game' && !this._lcm2.isGameClientForeground()) {
        return
      }

      this._sendPlayerStatsInGame('our')
    }

    const sendTheir = () => {
      if (this._isSimulatingKeyboard) {
        this._isSimulatingKeyboard = false
        return
      }

      if (!this._lcm2.isGameClientForeground()) {
        return
      }

      this._sendPlayerStatsInGame('their')
    }

    this._disposers.add(() => this._pm.bus.off('global-shortcut/page-up', sendOur))
    this._disposers.add(() => this._pm.bus.off('global-shortcut/page-down', sendTheir))

    this._pm.bus.on('global-shortcut/page-up', sendOur)
    this._pm.bus.on('global-shortcut/page-down', sendTheir)
  }

  private async _sendPlayerStatsInGame(teamSide: 'our' | 'their') {
    if (!this.state.settings.sendKdaInGame || this.state.queryState.phase === 'unavailable') {
      return
    }

    if (this._isSimulatingKeyboard) {
      return
    }

    this._isSimulatingKeyboard = true

    if (
      !this._lcu.summoner.me ||
      !this.state.ongoingTeams ||
      !this.state.ongoingChampionSelections
    ) {
      this._logger.warn(
        `信息不足: ${this._lcu.summoner.me} ${this.state.ongoingTeams} ${this.state.ongoingChampionSelections}`
      )
      this._isSimulatingKeyboard = false
      return
    }

    const tasks: (() => Promise<any>)[] = []

    let selfTeam = ''
    for (const [t, players] of Object.entries(this.state.ongoingTeams)) {
      if (players.includes(this._lcu.summoner.me.puuid)) {
        selfTeam = t
        break
      }
    }

    if (!selfTeam) {
      this._isSimulatingKeyboard = false
      return
    }

    const teamsSet: Record<'our' | 'their', Set<string>> = {
      our: new Set(),
      their: new Set()
    }

    for (const [team, players] of Object.entries(this.state.ongoingTeams)) {
      if (team === selfTeam) {
        players.forEach((p) => teamsSet.our.add(p))
      } else {
        players.forEach((p) => teamsSet.their.add(p))
      }
    }

    const players = Array.from(this.state.ongoingPlayers.values()).filter((p) => {
      if (!p.matchHistory || (!this.state.ongoingChampionSelections?.[p.puuid] && !p.summoner)) {
        return false
      }

      if (teamSide === 'our') {
        return teamsSet.our.has(p.puuid)
      } else {
        return teamsSet.their.has(p.puuid)
      }
    })

    const sendPlayers = players.filter((p) => this.state.sendList[p.puuid])

    // 应对英雄重复的情况，一个典型是克隆模式
    const championCountMap = players.reduce(
      (obj, cur) => {
        const playerSelected = this.state.ongoingChampionSelections![cur.puuid]

        if (obj[playerSelected]) {
          obj[playerSelected]++
        } else {
          obj[playerSelected] = 1
        }

        return obj
      },
      {} as Record<number, number>
    )

    const texts: string[] = []

    if (sendPlayers.length) {
      const prefixText =
        sendPlayers.length === 1
          ? sendPlayers[0].summoner?.gameName || sendPlayers[0].summoner?.displayName || ''
          : teamSide === 'our'
            ? '我方'
            : '敌方'

      texts.push(`${prefixText}近${this.state.settings.matchHistoryLoadCount}场平均KDA：`)
    }

    sendPlayers
      .map((p) => {
        const analysis = getAnalysis(withSelfParticipantMatchHistory(p.matchHistory || [], p.puuid))
        return {
          player: p,
          analysis,
          isEmpty: !p.matchHistory || p.matchHistory.length === 0
        }
      })
      .filter(({ analysis }) => analysis.averageKda >= this.state.settings.sendKdaThreshold)
      .map(({ player, analysis, isEmpty }) => {
        let name: string | undefined
        let playerSelected = this.state.ongoingChampionSelections![player.puuid]
        if (playerSelected && championCountMap[playerSelected] > 1) {
          name = player.summoner?.gameName || player.summoner?.displayName
        } else {
          name =
            this._lcu.gameData.champions[playerSelected || 0]?.name ||
            player.summoner?.gameName ||
            player.summoner?.displayName
        }

        name = name || player.puuid.slice(0, 4)

        if (isEmpty) {
          return `${name} 近期无有效对局`
        }

        if (this.state.ongoingGameInfo?.queueType === 'CHERRY') {
          return `${name} 第一率${((analysis.cherryTop1s / analysis.cherryGames) * 100).toFixed()}% 前四率${((analysis.cherryTop4s / analysis.cherryGames) * 100).toFixed()}%`
        }

        const field1 =
          analysis.winningStreak > 3
            ? ` ${analysis.winningStreak}连胜`
            : analysis.losingStreak > 3
              ? ` ${analysis.losingStreak}连败`
              : ''
        return `${name} 平均KDA ${analysis.averageKda.toFixed(2)} 胜率${analysis.winningRate.toFixed()}${field1}`
      })
      .forEach((t) => texts.push(t))

    if (this.state.settings.sendKdaInGameWithPreMadeTeams) {
      const theirTeamKey = Object.keys(this.state.ongoingTeams).find((t) => t !== selfTeam)

      if (teamSide === 'their' && !theirTeamKey) {
        this._isSimulatingKeyboard = false
        return
      }

      const subTeams =
        teamSide === 'our'
          ? this.state.ongoingPreMadeTeams[selfTeam]
          : this.state.ongoingPreMadeTeams[theirTeamKey || 'akari~akari~'] // as empty key to dodge the error

      const teamNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

      if (subTeams.length) {
        for (let i = 0; i < subTeams.length; i++) {
          const group = subTeams[i]
          const identities = group.map((p) => {
            return (
              this._lcu.gameData.champions[this.state.ongoingChampionSelections![p]]?.name ||
              this.state.ongoingPlayers[p]?.summoner?.gameName ||
              this.state.ongoingPlayers[p]?.summoner?.displayName ||
              p.toString()
            )
          })

          texts.push(
            `开黑${subTeams.length === 1 ? '' : '小队'}${subTeams.length === 1 ? '' : teamNames[i] || i} ${identities.join(' ')}`
          )
        }
      }
    }

    if (!texts.length) {
      this._isSimulatingKeyboard = false
      return
    }

    if (this.state.queryState.phase === 'champ-select') {
      if (this._lcu.chat.conversations.championSelect) {
        for (let i = 0; i < texts.length; i++) {
          tasks.push(() => chatSend(this._lcu.chat.conversations.championSelect!.id, texts[i]))

          if (i !== texts.length - 1) {
            tasks.push(() => sleep(CoreFunctionalityModule.SEND_INTERVAL))
          }
        }
      }
    } else if (this.state.queryState.phase === 'in-game') {
      for (let i = 0; i < texts.length; i++) {
        tasks.push(async () => {
          this._pm.sendKey(13, true)
          this._pm.sendKey(13, false)
          await sleep(CoreFunctionalityModule.SEND_INTERVAL)
          this._pm.sendInputString(texts[i])
          await sleep(CoreFunctionalityModule.SEND_INTERVAL)
          this._pm.sendKey(13, true)
          this._pm.sendKey(13, false)
        })

        if (i !== texts.length - 1) {
          tasks.push(() => sleep(CoreFunctionalityModule.SEND_INTERVAL))
        }
      }
    }

    for (const task of tasks) {
      if (!this._isSimulatingKeyboard) {
        return
      }
      await task()
    }

    this._isSimulatingKeyboard = false
  }

  private _analyzeTeamUp() {
    if (!this.state.ongoingTeams) {
      return null
    }

    const games = Array.from(this.state.tempDetailedGames.values())

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
    const result = Object.entries(this.state.ongoingTeams).reduce(
      (obj, [team, teamPlayers]) => {
        obj[team] = calculateTogetherTimes(
          matches,
          teamPlayers,
          this.state.settings.preMadeTeamThreshold
        )

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

  private async _loadPlayerStats(
    signal: AbortSignal,
    puuid: string,
    queueId: number | null,
    useSgpApi = true,
    retries = 2
  ) {
    if (!this.state.ongoingPlayers.has(puuid)) {
      runInAction(() =>
        this.state.ongoingPlayers.set(
          puuid,
          observable({ puuid, useSgpApi, matchHistoryQueue: null }, {}, { deep: false })
        )
      )
      this.sendEvent('create/ongoing-player', puuid)
    }

    const player = this.state.ongoingPlayers.get(puuid)!

    try {
      // 召唤师信息必须被提前加载完成
      this._logger.info(`加载玩家信息 Summoner: ${puuid}`)
      const summonerInfo = await this._playerAnalysisFetchLimiter
        .add(() => getSummonerByPuuid(puuid), {
          signal,
          priority: CoreFunctionalityModule.FETCH_PRIORITY.SUMMONER_INFO
        })
        .catch((error) => this._handleAbortError(error))

      if (!summonerInfo) {
        return
      }

      runInAction(() => (player.summoner = summonerInfo.data))

      this.sendEvent('update/ongoing-player/summoner', puuid, summonerInfo.data)

      const auth = this._lcm.state.auth
      const me = this._lcu.summoner.me

      if (!auth || !me) {
        return
      }

      const _loadSavedInfo = async () => {
        if (player.savedInfo) {
          return
        }

        this._logger.info(`加载玩家信息 SavedPlayer: ${puuid}`)

        const savedInfo = await this._sm.players.querySavedPlayerWithGames({
          region: auth.region,
          rsoPlatformId: auth.rsoPlatformId,
          selfPuuid: me.puuid,
          puuid: puuid,
          queueType: this.state.ongoingGameInfo?.queueType === 'TFT' ? 'TFT' : undefined // TODO 暂不支持云顶的对局
        })

        if (savedInfo) {
          runInAction(() => (player.savedInfo = savedInfo))
          this.sendEvent('update/ongoing-player/saved-info', puuid, savedInfo)
        }
      }

      const _loadRankedStats = async () => {
        if (player.rankedStats) {
          return
        }

        this._logger.info(`加载玩家信息 Ranked: ${puuid}`)

        const rankedStats = await this._playerAnalysisFetchLimiter
          .add(() => getRankedStats(puuid), {
            signal,
            priority: CoreFunctionalityModule.FETCH_PRIORITY.RANKED_STATS
          })
          .catch((error) => this._handleAbortError(error))

        if (rankedStats) {
          runInAction(() => (player.rankedStats = rankedStats.data))

          this.sendEvent('update/ongoing-player/ranked-stats', puuid, rankedStats.data)
        }
      }

      const _loadMatchHistory = async (queueId: number | null, useSgpApi = true) => {
        if (
          player.matchHistory &&
          player.matchHistoryQueue === queueId &&
          player.useSgpApi === useSgpApi
        ) {
          return
        }

        const sgpApiAvailable =
          useSgpApi && this._edsm.sgp.state.availability.serversSupported.matchHistory

        runInAction(() => {
          if (sgpApiAvailable) {
            player.matchHistoryQueue = queueId
          } else {
            player.matchHistoryQueue = null
          }
          player.useSgpApi = useSgpApi
        })

        this._logger.info(
          `Use API: ${sgpApiAvailable ? 'SGP' : 'LCU'}, 加载玩家信息 MatchHistory: ${puuid}`
        )

        try {
          const games = await this._playerAnalysisFetchLimiter
            .add(
              async () => {
                if (sgpApiAvailable) {
                  const result = await this._edsm.sgp.getMatchHistoryLcuFormat(
                    puuid,
                    0,
                    this.state.settings.matchHistoryLoadCount,
                    queueId !== null ? `q_${queueId}` : undefined
                  )
                  return result.games.games
                } else {
                  const { data } = await getMatchHistory(
                    summonerInfo.data.puuid,
                    0,
                    this.state.settings.matchHistoryLoadCount - 1,
                    retries
                  )

                  const tasks = data.games.games.map(async (g) => {
                    const { data: game } = await getGame(g.gameId) // LCU 会走缓存, 因此这里不限速
                    return game
                  })

                  return await Promise.all(tasks)
                }
              },
              { signal, priority: CoreFunctionalityModule.FETCH_PRIORITY.MATCH_HISTORY }
            )
            .catch((error) => this._handleAbortError(error))

          if (!games) {
            return
          }

          const withDetailedFields = games.map((g) => ({
            game: g,
            battle: undefined,
            isDetailed: true // 现在始终 true
          }))

          runInAction(() => {
            withDetailedFields.forEach((g) => {
              this.state.tempDetailedGames.set(g.game.gameId, g.game)
            })
          })

          runInAction(() => {
            player.matchHistory = withDetailedFields
            this.sendEvent('update/ongoing-player/match-history', puuid, withDetailedFields)
          })

          // 异步加载 TGP 对局列表
          if (this._tam.state.settings.enabled && !this._tam.state.settings.expired && player.summoner) {
            const players = await this._tam.searchPlayer(`${player.summoner.gameName}#${player.summoner.tagLine}`)
            if (players && players[0]) {
              const battles = await this._tam.getBattleList(players[0], 1, this.state.settings.matchHistoryLoadCount)

              runInAction(() => {
                withDetailedFields.forEach((g) => {
                  const battle = battles?.find((battle) => g.game.gameId.toString() === battle.game_id)
                  if (battle) {
                    g.battle = battle
                  }
                });
              });

              this.sendEvent('update/ongoing-player/match-history', puuid, withDetailedFields)
            }
          }
        } catch (error) {
          this._logger.warn(`无法加载战绩, ID: ${puuid} ${formatError(error)}`)
        }
      }

      const _loadChampionMastery = async () => {
        if (player.championMastery) {
          return
        }

        this._logger.info(`加载玩家信息 ChampionMastery: ${puuid}`)
        const mastery = await this._playerAnalysisFetchLimiter
          .add(() => getPlayerChampionMastery(puuid), {
            signal,
            priority: CoreFunctionalityModule.FETCH_PRIORITY.CHAMPION_MASTERY
          })
          .catch((error) => this._handleAbortError(error))

        if (mastery) {
          const simplified = mastery.data
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

          runInAction(() => (player.championMastery = simplified))
          this.sendEvent('update/ongoing-player/champion-mastery', puuid, simplified)
        }
      }

      await Promise.allSettled([
        _loadSavedInfo(),
        _loadRankedStats(),
        _loadMatchHistory(queueId, useSgpApi),
        _loadChampionMastery()
      ])
    } catch (error) {
      this._logger.warn(`无法加载召唤师信息, ID: ${puuid} ${formatError(error)}`)
    }
  }

  private async _champSelectQuery(signal: AbortSignal, queueId: number | null, useSgpApi = true) {
    const session = this._lcu.champSelect.session
    if (!session) {
      return
    }

    const m = session.myTeam
      .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
      .map((t) => ({ puuid: t.puuid }))

    const t = session.theirTeam
      .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
      .map((t) => ({ puuid: t.puuid }))

    const visiblePlayerPuuids = [...m, ...t]

    const playerTasks = visiblePlayerPuuids.map((p) => {
      return this._loadPlayerStats(signal, p.puuid, queueId, useSgpApi)
    })

    await Promise.allSettled(playerTasks)
  }

  private async _inGameQuery(signal: AbortSignal, queueId: number | null, useSgpApi = true) {
    const session = this._lcu.gameflow.session

    if (!session) {
      return
    }

    const m = session.gameData.teamOne
      .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
      .map((t) => ({ puuid: t.puuid }))

    const t = session.gameData.teamTwo
      .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
      .map((t) => ({ puuid: t.puuid }))

    const visiblePlayerPuuids = [...m, ...t]

    const playerTasks = visiblePlayerPuuids.map((p) => {
      return this._loadPlayerStats(signal, p.puuid, queueId, useSgpApi)
    })

    await Promise.allSettled(playerTasks)
  }

  private _handleAbortError(e: any) {
    if (e instanceof Error && e.name === 'AbortError') {
      return
    }
    return Promise.reject(e)
  }

  private _setupStateSync() {
    this.propSync('state', this.state, [
      'isInEndgamePhase',
      'queryState',
      'ongoingGameInfo',
      'ongoingChampionSelections',
      'ongoingPreMadeTeams',
      'ongoingTeams',
      'ongoingPositionAssignments',
      'sendList',
      'ongoingPlayerAnalysis',
      'queueFilter',
      'settings.autoRouteOnGameStart',
      'settings.fetchDetailedGame',
      'settings.sendKdaInGame',
      'settings.sendKdaInGameWithPreMadeTeams',
      'settings.sendKdaThreshold',
      'settings.fetchAfterGame',
      'settings.playerAnalysisFetchConcurrency',
      'settings.ongoingAnalysisEnabled',
      'settings.matchHistoryLoadCount',
      'settings.preMadeTeamThreshold',
      'settings.useSgpApi',
      'settings.orderPlayerBy'
    ])
  }

  private _setupMethodCall() {
    this.onCall('get/ongoing-players', (_) => {
      return toJS(this.state.ongoingPlayers)
    })

    this.onCall('set-send-list', (puuid: string, send: boolean) => {
      if (this.state.sendList[puuid] !== undefined) {
        this.state.setSendList({ ...this.state.sendList, [puuid]: send })
      }
    })

    this.onCall('save/saved-player', async (player) => {
      const r = await this._sm.players.saveSavedPlayer(player)

      if (this.state.ongoingPlayers) {
        const p = this.state.ongoingPlayers.get(player.puuid)
        if (p) {
          const savedInfo = await this._sm.players.querySavedPlayerWithGames({
            region: player.region,
            rsoPlatformId: player.rsoPlatformId,
            selfPuuid: player.selfPuuid,
            puuid: player.puuid
          })

          if (savedInfo) {
            runInAction(() => (p.savedInfo = savedInfo))
            this.sendEvent('update/ongoing-player/saved-info', player.puuid, savedInfo)
          }
        }
      }

      return r
    })

    /**
     * 设置战绩队列筛选，仅限使用 SGP 服务器时有效
     */
    this.onCall('set-queue-filter', (queueFilter: number) => {
      this.state.setQueueFilter(queueFilter)
    })

    /**
     * 刷新对局分析的所有当前内容
     */
    this.onCall('refresh', () => {
      if (
        this.state.queryState.phase === 'unavailable' ||
        !this.state.settings.ongoingAnalysisEnabled
      ) {
        return
      }

      this.sendEvent('clear/ongoing-players')
      runInAction(() => {
        this.state.ongoingPlayers.clear()
        this.state.tempDetailedGames.clear()
        this.state.ongoingPreMadeTeams = {}
        this.state.ongoingPlayerAnalysis = null
      })

      this._loadAllPlayers(
        this.state.queryState,
        this.state.queueFilter,
        this.state.settings.useSgpApi
      )
    })
  }

  private async _setupSettings() {
    this.registerSettings([
      {
        key: 'autoRouteOnGameStart',
        defaultValue: this.state.settings.autoRouteOnGameStart
      },
      {
        key: 'fetchDetailedGame',
        defaultValue: this.state.settings.fetchDetailedGame
      },
      {
        key: 'sendKdaInGame',
        defaultValue: this.state.settings.sendKdaInGame
      },
      {
        key: 'sendKdaInGameWithPreMadeTeams',
        defaultValue: this.state.settings.sendKdaInGameWithPreMadeTeams
      },
      {
        key: 'sendKdaThreshold',
        defaultValue: this.state.settings.sendKdaThreshold
      },
      {
        key: 'fetchAfterGame',
        defaultValue: this.state.settings.fetchAfterGame
      },
      {
        key: 'playerAnalysisFetchConcurrency',
        defaultValue: this.state.settings.playerAnalysisFetchConcurrency
      },
      {
        key: 'ongoingAnalysisEnabled',
        defaultValue: this.state.settings.ongoingAnalysisEnabled
      },
      {
        key: 'matchHistoryLoadCount',
        defaultValue: this.state.settings.matchHistoryLoadCount
      },
      {
        key: 'preMadeTeamThreshold',
        defaultValue: this.state.settings.preMadeTeamThreshold
      },
      {
        key: 'useSgpApi',
        defaultValue: this.state.settings.useSgpApi
      },
      {
        key: 'orderPlayerBy',
        defaultValue: this.state.settings.orderPlayerBy
      }
    ])

    const settings = await this.readSettings()
    runInAction(() => {
      settings.forEach((s) => set(this.state.settings, s.settingItem, s.value))
    })

    const defaultSetter: RegisteredSettingHandler = async (key, value, apply) => {
      runInAction(() => set(this.state.settings, key, value))
      await apply(key, value)
    }

    this.onSettingChange<Paths<typeof this.state.settings>>('autoRouteOnGameStart', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('fetchDetailedGame', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('sendKdaInGame', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>(
      'sendKdaInGameWithPreMadeTeams',
      defaultSetter
    )
    this.onSettingChange<Paths<typeof this.state.settings>>(
      'sendKdaThreshold',
      async (key, value, apply) => {
        if (value < 0) {
          value = 0
        }

        runInAction(() => set(this.state.settings, key, value))
        await apply(key, value)
      }
    )
    this.onSettingChange<Paths<typeof this.state.settings>>('fetchAfterGame', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>(
      'playerAnalysisFetchConcurrency',
      async (key, value, apply) => {
        if (value < 1) {
          value = 1
        }

        this._playerAnalysisFetchLimiter.concurrency = value

        runInAction(() => set(this.state.settings, key, value))
        await apply(key, value)
      }
    )
    this.onSettingChange<Paths<typeof this.state.settings>>('ongoingAnalysisEnabled', defaultSetter)

    this.onSettingChange<Paths<typeof this.state.settings>>(
      'matchHistoryLoadCount',
      async (key, value, apply) => {
        if (value <= 1 || value > 200) {
          return
        }

        if (value < this.state.settings.preMadeTeamThreshold) {
          runInAction(() => set(this.state.settings, key, value))
          await apply('preMadeTeamThreshold', value)
        }

        set(this.state.settings, key, value)
        await apply(key, value)
      }
    )
    this.onSettingChange<Paths<typeof this.state.settings>>('preMadeTeamThreshold', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('useSgpApi', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('orderPlayerBy', defaultSetter)
  }
}

export const coreFunctionalityModule = new CoreFunctionalityModule()
