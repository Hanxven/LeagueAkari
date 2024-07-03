import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { SavedPlayer } from '@main/db/entities/SavedPlayers'
import { chatSend } from '@main/http-api/chat'
import { getGame, getMatchHistory } from '@main/http-api/match-history'
import { getRankedStats } from '@main/http-api/ranked'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { EMPTY_PUUID } from '@shared/constants/common'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { getAnalysis, withSelfParticipantMatchHistory } from '@shared/utils/analysis'
import { formatError } from '@shared/utils/errors'
import { summonerName } from '@shared/utils/name'
import { cancellableSleep, sleep } from '@shared/utils/sleep'
import { calculateTogetherTimes, removeSubsets } from '@shared/utils/team-up-calc'
import dayjs from 'dayjs'
import { comparer, computed, observable, runInAction, toJS } from 'mobx'
import PQueue from 'p-queue'

import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { AppLogger, LogModule } from '../akari-core/log'
import { MainWindowModule } from '../akari-core/main-window'
import { PlatformModule } from '../akari-core/platform'
import { SettingService } from '../akari-core/storage'
import { LcuSyncModule } from '../lcu-state-sync'
import { CoreFunctionalityState } from './state'

export class CoreFunctionalityModule extends MobxBasedBasicModule {
  public state = new CoreFunctionalityState()

  static FETCH_PRIORITY = {
    SUMMONER_INFO: 97,
    MATCH_HISTORY: 89,
    RANKED_STATS: 83,
    GAME: 79
  } as const

  static SEND_INTERVAL = 65

  private _controller: AbortController | null = null
  private _playerAnalysisFetchLimiter = new PQueue()

  private _logger: AppLogger
  private _lcm: LcuConnectionModule
  private _lcu: LcuSyncModule
  private _pm: PlatformModule
  private _mwm: MainWindowModule

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
    this._mwm = this.manager.getModule('main-window')
    this._pm = this.manager.getModule('win-platform')

    await this._setupSettingsSync()
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
    this.autoDisposeReaction(
      () => this.state.ongoingGameInfo,
      () => {
        this._logger.info(`当前游戏信息: ${toJS(this.state.ongoingGameInfo)}`)
      }
    )

    this.autoDisposeReaction(
      () => this.state.queryState,
      (s) => {
        this._logger.info(`当前对局分析查询阶段: ${s}`)
      }
    )
  }

  private _handleOngoingAnalyzing() {
    this.autoDisposeReaction(
      () => [this.state.queryState, this.state.settings.ongoingAnalysisEnabled] as const,
      async ([state, s]) => {
        if (state === 'unavailable' || !s) {
          this.sendEvent('clear/ongoing-players')
          this.state.clearOngoingVars()
          this._controller?.abort()
          this._controller = null
          return
        }

        if (!this._controller) {
          this._controller = new AbortController()
        }

        try {
          if (state === 'champ-select') {
            try {
              // 15 毫秒的阈值
              if (this.state.settings.delaySecondsBeforeLoading > 0.015) {
                this.state.setWaitingForDelay(true)
                await cancellableSleep(
                  this.state.settings.delaySecondsBeforeLoading * 1e3,
                  this._controller.signal
                )
              }
            } catch {
              /* the error type can only be AbortError */
              return
            } finally {
              this.state.setWaitingForDelay(false)
            }
            await this._champSelectQuery(this._controller.signal)
          } else if (state === 'in-game') {
            await this._inGameQuery(this._controller.signal)
          }
        } catch (error) {
          this._mwm.notify.warn('core-functionality', '对局中', '无法加载对局中信息')
          this._logger.warn(`加载对局中信息时发生错误:  ${formatError(error)}, in ${state}`)
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )

    this.autoDisposeReaction(
      () =>
        [
          Array.from(this.state.tempDetailedGames.values()),
          Array.from(this.state.ongoingPlayers.values()).map((p) => p.summoner),
          this.state.ongoingTeams
        ] as const,
      () => {
        const result = this._analyzeTeamUp()
        if (result && this.state.queryState !== 'unavailable') {
          runInAction(() => (this.state.ongoingPreMadeTeams = result))
        }
      },
      { delay: 500 }
    )
  }

  private _handleTaggedPlayerReminder() {
    this.autoDisposeReaction(
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

    this.autoDisposeReaction(
      () => this._lcu.chat.conversations.championSelect,
      (c) => {
        if (c) {
          this._tagRemindingQueue.start()
        } else {
          this._tagRemindingQueue.pause()
        }
      }
    )

    this.autoDisposeReaction(
      () => this.state.queryState,
      (s) => {
        if (s === 'unavailable') {
          this._tagSendQueuedPlayers.clear()
          this._tagRemindingQueue.clear()
        }
      }
    )
  }

  private _formatTagRemindingText(
    summonerInfo: SummonerInfo,
    savedInfo: SavedPlayer & { encounteredGames: number[] }
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
    this.autoDisposeReaction(
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
    this.autoDisposeReaction(
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

      this._sendPlayerStatsInGame('our')
    }

    const sendTheir = () => {
      if (this._isSimulatingKeyboard) {
        this._isSimulatingKeyboard = false
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
    if (!this.state.settings.sendKdaInGame || this.state.queryState === 'unavailable') {
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
      const subTeams = this.state.ongoingPreMadeTeams.filter((t) => {
        if (teamSide === 'our') {
          return t.team && t.team === selfTeam
        } else {
          return t.team && t.team !== selfTeam
        }
      })

      const teamName = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

      if (subTeams.length) {
        for (let i = 0; i < subTeams.length; i++) {
          const identities = subTeams[i].players.map((p) => {
            return (
              this._lcu.gameData.champions[this.state.ongoingChampionSelections![p]]?.name ||
              this.state.ongoingPlayers[p]?.summoner?.gameName ||
              this.state.ongoingPlayers[p]?.summoner?.displayName ||
              p.toString()
            )
          })

          texts.push(
            `开黑${subTeams.length === 1 ? '' : '小队'}${subTeams.length === 1 ? '' : teamName[i] || i} ${identities.join(' ')}`
          )
        }
      }
    }

    if (!texts.length) {
      this._isSimulatingKeyboard = false
      return
    }

    if (this.state.queryState === 'champ-select') {
      if (this._lcu.chat.conversations.championSelect) {
        for (let i = 0; i < texts.length; i++) {
          tasks.push(() => chatSend(this._lcu.chat.conversations.championSelect!.id, texts[i]))

          if (i !== texts.length - 1) {
            tasks.push(() => sleep(CoreFunctionalityModule.SEND_INTERVAL))
          }
        }
      }
    } else if (this.state.queryState === 'in-game') {
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

    // result 即为最终计算的组队情况，之后使用 `removeSubsets` 进行进一步化简，移除一些可能不关心的结果
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

    const teams: { players: string[]; times: number; team: string; _id: number }[] = []

    Object.entries(result).forEach(([team, preMade]) => {
      teams.push(...preMade.map((t, i) => ({ ...t, team, _id: i })))
    })

    // 去除一些不关心的子集，虽然这些子集可能具有更多的共同场次
    return removeSubsets(teams, (team) => team.players)
  }

  private async _loadPlayerStats(signal: AbortSignal, puuid: string, retries = 2) {
    if (!this.state.ongoingPlayers.has(puuid)) {
      runInAction(() =>
        this.state.ongoingPlayers.set(puuid, observable({ puuid }, {}, { deep: false }))
      )
      this.sendEvent('create/ongoing-player', puuid)
    }

    const player = this.state.ongoingPlayers.get(puuid)!

    try {
      // 召唤师信息必须被提前加载完成
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

        const savedInfo = await this._sm.players.querySavedPlayerWithGames({
          region: auth.region,
          rsoPlatformId: auth.rsoPlatformId,
          selfPuuid: me.puuid,
          puuid: puuid,
          queueType: this.state.ongoingGameInfo?.queueType === 'TFT' ? 'TFT' : undefined
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

      const _loadMatchHistory = async () => {
        if (player.matchHistory) {
          return
        }

        try {
          const matchHistory = await this._playerAnalysisFetchLimiter
            .add(
              () =>
                getMatchHistory(
                  summonerInfo.data.puuid,
                  0,
                  this.state.settings.matchHistoryLoadCount - 1,
                  retries
                ),
              { signal, priority: CoreFunctionalityModule.FETCH_PRIORITY.MATCH_HISTORY }
            )
            .catch((error) => this._handleAbortError(error))

          if (!matchHistory) {
            return
          }

          const withDetailedFields = matchHistory.data.games.games.map((g) => ({
            game: g,
            isDetailed: false
          }))

          withDetailedFields.forEach((g) => {
            if (g.isDetailed) {
              this.state.tempDetailedGames.set(g.game.gameId, g.game)
            }
          })

          runInAction(() => {
            player.matchHistory = withDetailedFields
          })

          this.sendEvent('update/ongoing-player/match-history', puuid, withDetailedFields)

          const loadGameTasks: Promise<void>[] = []

          for (let i = 0; i < this.state.settings.matchHistoryLoadCount; i++) {
            const game = player.matchHistory![i]

            const _loadGame = async () => {
              if (this.state.tempDetailedGames.has(game.game.gameId)) {
                runInAction(() => {
                  game.isDetailed = true
                  game.game = this.state.tempDetailedGames.get(game.game.gameId)!
                })
                return
              }

              try {
                const g = await this._playerAnalysisFetchLimiter
                  .add(() => getGame(game.game.gameId), {
                    signal,
                    priority: CoreFunctionalityModule.FETCH_PRIORITY.GAME
                  })
                  .catch((error) => this._handleAbortError(error))

                if (!g) {
                  return
                }

                runInAction(() => {
                  game.isDetailed = true
                  game.game = g.data
                  this.state.tempDetailedGames.set(g.data.gameId, g.data)
                })

                this.sendEvent('update/ongoing-player/match-history/detailed-game', puuid, g.data)
              } catch (error) {
                this._logger.warn(`无法加载对局, ID: ${game.game.gameId} ${formatError(error)}`)
                // throw error // it will not cause an error
              }
            }

            loadGameTasks.push(_loadGame())
            await Promise.allSettled(loadGameTasks)
          }
        } catch (error) {
          this._logger.warn(`无法加载战绩, ID: ${puuid} ${formatError(error)}`)
        }
      }

      await Promise.allSettled([_loadSavedInfo(), _loadRankedStats(), _loadMatchHistory()])
    } catch (error) {
      this._logger.warn(`无法加载召唤师信息, ID: ${puuid} ${formatError(error)}`)
    }
  }

  private async _champSelectQuery(signal: AbortSignal) {
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
      return this._loadPlayerStats(signal, p.puuid)
    })

    await Promise.allSettled(playerTasks)
  }

  private async _inGameQuery(signal: AbortSignal) {
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
      return this._loadPlayerStats(signal, p.puuid)
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
    this.simpleSync('is-in-endgame-phase', () => this.state.isInEndgamePhase)
    this.simpleSync('ongoing-game-info', () => this.state.ongoingGameInfo)
    this.simpleSync('query-state', () => this.state.queryState)
    this.simpleSync('ongoing-champion-selections', () => this.state.ongoingChampionSelections)
    this.simpleSync('ongoing-pre-made-teams', () => this.state.ongoingPreMadeTeams)
    this.simpleSync('ongoing-teams', () => this.state.ongoingTeams)
    this.simpleSync('send-list', () => toJS(this.state.sendList))
    this.simpleSync('is-waiting-for-delay', () => this.state.isWaitingForDelay)
  }

  private _setupMethodCall() {
    this.onCall('get/ongoing-players', (_) => {
      return toJS(this.state.ongoingPlayers)
    })

    this.onCall('update/send-list', (puuid: string, send: boolean) => {
      if (this.state.sendList[puuid] !== undefined) {
        runInAction(() => (this.state.sendList[puuid] = send))
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
  }

  private async _setupSettingsSync() {
    this.simpleSettingSync(
      'auto-route-on-game-start',
      () => this.state.settings.autoRouteOnGameStart,
      (s) => this.state.settings.setAutoRouteOnGameStart(s)
    )

    this.simpleSettingSync(
      'fetch-detailed-game',
      () => this.state.settings.fetchDetailedGame,
      (s) => this.state.settings.setFetchDetailedGame(s)
    )

    this.simpleSettingSync(
      'send-kda-in-game',
      () => this.state.settings.sendKdaInGame,
      (s) => this.state.settings.setSendKdaInGame(s)
    )

    this.simpleSettingSync(
      'send-kda-in-game-with-pre-made-teams',
      () => this.state.settings.sendKdaInGameWithPreMadeTeams,
      (s) => this.state.settings.setSendKdaInGameWithPreMadeTeams(s)
    )

    this.simpleSettingSync(
      'send-kda-threshold',
      () => this.state.settings.sendKdaThreshold,
      (s, ss) => {
        if (s < 0) {
          s = 0
        }

        this.state.settings.setSendKdaThreshold(s)
        ss.set('send-kda-threshold', s)
        return true
      }
    )

    this.simpleSettingSync(
      'fetch-after-game',
      () => this.state.settings.fetchAfterGame,
      (s) => this.state.settings.setFetchAfterGame(s)
    )

    this.simpleSettingSync(
      'player-analysis-fetch-concurrency',
      () => this.state.settings.playerAnalysisFetchConcurrency,
      async (s, ss) => {
        if (s < 1) {
          s = 1
        }

        this._playerAnalysisFetchLimiter.concurrency = s

        this.state.settings.setPlayerAnalysisFetchConcurrency(s)
        await ss.set('player-analysis-fetch-concurrency', s)

        return true
      }
    )

    this.simpleSettingSync(
      'ongoing-analysis-enabled',
      () => this.state.settings.ongoingAnalysisEnabled,
      (s) => this.state.settings.setOngoingAnalysisEnabled(s)
    )

    this.simpleSettingSync(
      'delay-seconds-before-loading',
      () => this.state.settings.delaySecondsBeforeLoading,
      async (s, ss) => {
        if (s < 0) {
          s = 0
        }

        this.state.settings.setDelaySecondsBeforeLoading(s)
        await ss.set('delay-seconds-before-loading', s)
        return true
      }
    )

    const setPreMadeTeamThreshold = async (threshold: number, ss: SettingService) => {
      if (threshold <= 1) {
        return
      }

      this.state.settings.setPreMadeTeamThreshold(threshold)
      await ss.set('pre-made-team-threshold', threshold)
    }

    this.simpleSettingSync(
      'match-history-load-count',
      () => this.state.settings.matchHistoryLoadCount,
      async (count, ss) => {
        if (count <= 1 || count > 200) {
          return
        }

        if (count < this.state.settings.preMadeTeamThreshold) {
          await setPreMadeTeamThreshold(count, ss)
        }

        this.state.settings.setMatchHistoryLoadCount(count)
        await ss.set('match-history-load-count', count)

        return true
      }
    )

    this.simpleSettingSync(
      'pre-made-team-threshold',
      () => this.state.settings.preMadeTeamThreshold,
      async (threshold, ss) => {
        await setPreMadeTeamThreshold(threshold, ss)
        return true
      }
    )

    this.simpleSettingSync(
      'match-history-source',
      () => this.state.settings.matchHistorySource,
      (s) => this.state.settings.setMatchHistorySource(s)
    )

    await this.loadSettings()
  }
}

export const coreFunctionalityModule = new CoreFunctionalityModule()
