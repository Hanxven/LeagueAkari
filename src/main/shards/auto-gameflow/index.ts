import { i18next } from '@main/i18n'
import { TimeoutTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { ChoiceMaker } from '@shared/utils/choice-maker'
import { formatError, formatErrorMessage } from '@shared/utils/errors'
import { randomInt } from '@shared/utils/random'
import { comparer, computed } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoGameflowSettings, AutoGameflowState } from './state'

/**
 * 自动游戏流程相关功能
 */
@Shard(AutoGameflowMain.id)
export class AutoGameflowMain implements IAkariShardInitDispose {
  static id = 'auto-gameflow-main'

  public readonly settings = new AutoGameflowSettings()
  public readonly state: AutoGameflowState

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private _autoAcceptTimerId: NodeJS.Timeout | null = null
  private _autoSearchMatchTimerId: NodeJS.Timeout | null = null
  private _autoSearchMatchCountdownTimerId: NodeJS.Timeout | null = null

  private _playAgainTask = new TimeoutTask(() => this._playAgainFn())
  private _dodgeTask = new TimeoutTask(() => this._dodgeFn())
  private _reconnectTask = new TimeoutTask(() => this._reconnectFn())

  static HONOR_CATEGORY = ['HEART'] as const

  static PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT = 3250
  static PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT = 10000
  static PLAY_AGAIN_BUFFER_TIMEOUT = 1575

  constructor(
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _settingFactory: SettingFactoryMain,
    private readonly _lc: LeagueClientMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._log = _loggerFactory.create(AutoGameflowMain.id)
    this.state = new AutoGameflowState(this._lc.data, this.settings)
    this._setting = _settingFactory.register(
      AutoGameflowMain.id,
      {
        autoAcceptDelaySeconds: { default: this.settings.autoAcceptDelaySeconds },
        autoAcceptEnabled: { default: this.settings.autoAcceptEnabled },
        autoHonorEnabled: { default: this.settings.autoHonorEnabled },
        autoHonorStrategy: { default: this.settings.autoHonorStrategy },
        autoMatchmakingDelaySeconds: { default: this.settings.autoMatchmakingDelaySeconds },
        autoMatchmakingEnabled: { default: this.settings.autoMatchmakingEnabled },
        autoMatchmakingMaximumMatchDuration: {
          default: this.settings.autoMatchmakingMaximumMatchDuration
        },
        autoMatchmakingMinimumMembers: { default: this.settings.autoMatchmakingMinimumMembers },
        playAgainEnabled: { default: this.settings.playAgainEnabled },
        autoReconnectEnabled: { default: this.settings.autoReconnectEnabled },
        autoMatchmakingRematchFixedDuration: {
          default: this.settings.autoMatchmakingRematchFixedDuration
        },
        autoSkipLeaderEnabled: {
          default: this.settings.autoSkipLeaderEnabled
        },
        autoMatchmakingRematchStrategy: { default: this.settings.autoMatchmakingRematchStrategy },
        autoMatchmakingWaitForInvitees: { default: this.settings.autoMatchmakingWaitForInvitees },
        autoHandleInvitationsEnabled: { default: this.settings.autoHandleInvitationsEnabled },
        dodgeAtLastSecondThreshold: { default: this.settings.dodgeAtLastSecondThreshold },
        invitationHandlingStrategies: { default: this.settings.invitationHandlingStrategies },
        rejectInvitationWhenAway: { default: this.settings.rejectInvitationWhenAway }
      },
      this.settings
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(AutoGameflowMain.id, 'cancelAutoAccept', () => {
      this.cancelAutoAccept('normal')
    })
    this._ipc.onCall(AutoGameflowMain.id, 'cancelAutoMatchmaking', () => {
      this.cancelAutoMatchmaking('normal')
    })
    this._ipc.onCall(AutoGameflowMain.id, 'setWillDodgeAtLastSecond', (_, enabled: boolean) => {
      this.state.setWillDodgeAtLastSecond(enabled)
    })
  }

  private _handleLogging() {
    // 监听 gameflow
    this._mobx.reaction(
      () => this._lc.data.gameflow.phase,
      (phase) => {
        this._log.info(`游戏流阶段变化: ${phase}`)
      }
    )
  }

  private _handleAutoAccept() {
    this._mobx.reaction(
      () => this._lc.data.gameflow.phase,
      (phase) => {
        if (!this.settings.autoAcceptEnabled) {
          return
        }

        if (phase === 'ReadyCheck') {
          this.state.setAcceptAt(Date.now() + this.settings.autoAcceptDelaySeconds * 1e3)
          this._autoAcceptTimerId = setTimeout(
            () => this._acceptMatch(),
            this.settings.autoAcceptDelaySeconds * 1e3
          )

          this._log.info(`ReadyCheck! 即将在 ${this.settings.autoAcceptDelaySeconds} 秒后接受对局`)
        } else {
          if (this._autoAcceptTimerId) {
            if (this.state.willAccept) {
              this._log.info(`取消了即将进行的接受操作 - 不在游戏 ReadyCheck 过程中`)
            }

            clearTimeout(this._autoAcceptTimerId)
            this._autoAcceptTimerId = null
          }
          this.state.clearAutoAccept()
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this.settings.autoAcceptEnabled,
      (enabled) => {
        if (!enabled) {
          this.cancelAutoAccept('normal')
        }
      },
      { fireImmediately: true }
    )

    this._lc.events.on('/lol-matchmaking/v1/ready-check', (event) => {
      if (
        event.data &&
        (event.data.playerResponse === 'Declined' || event.data.playerResponse === 'Accepted')
      ) {
        this.cancelAutoAccept(event.data.playerResponse.toLowerCase())
      }
    })
  }

  private _handleAutoPlayAgain() {
    this._mobx.reaction(
      () => [this._lc.data.gameflow.phase, this.settings.playAgainEnabled] as const,
      async ([phase, enabled]) => {
        if (
          !enabled ||
          (phase !== 'WaitingForStats' && phase !== 'PreEndOfGame' && phase !== 'EndOfGame')
        ) {
          this._playAgainTask.cancel()
          return
        }

        // 如果停留在结算页面时间过长，将考虑返回
        if (phase === 'WaitingForStats' && enabled) {
          this._log.info(
            `位于 WaitingForStats，等待 ${AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT} ms`
          )
          this._playAgainTask.start(AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT)
          return
        }

        // 在某些模式中，可能会出现仅有 PreEndOfGame 的情况，需要做一个计时器
        if (phase === 'PreEndOfGame' && enabled) {
          this._log.info(`等待点赞事件 ${AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT} ms`)
          this._playAgainTask.start(AutoGameflowMain.PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT)
          return
        }

        if (phase === 'EndOfGame' && enabled) {
          this._log.info(`将在 ${AutoGameflowMain.PLAY_AGAIN_BUFFER_TIMEOUT} ms 后回到房间`)
          this._playAgainTask.start(AutoGameflowMain.PLAY_AGAIN_BUFFER_TIMEOUT)
          return
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }

  private _handleAutoReconnect() {
    this._mobx.reaction(
      () => [this._lc.data.gameflow.phase, this.settings.autoReconnectEnabled] as const,
      ([phase, enabled]) => {
        if (phase === 'Reconnect' && enabled) {
          this._log.info('将在短暂延迟后尝试重新连接')
          this._reconnectTask.start(1000)
        } else {
          this._reconnectTask.cancel()
        }
      }
    )
  }

  private _handleAutoHandleInvitation() {
    this._mobx.reaction(
      () =>
        [
          this._lc.data.lobby.receivedInvitations,
          this.settings.autoHandleInvitationsEnabled,
          this.settings.invitationHandlingStrategies,
          this.settings.rejectInvitationWhenAway,
          this._lc.data.chat.me?.availability
        ] as const,
      async ([invitations, enabled, strategies, rejectWhenAway, availability]) => {
        if (!enabled || invitations.length === 0) {
          return
        }

        if (rejectWhenAway && availability === 'away') {
          this._log.info('拒绝邀请：当前状态为离开')
          return
        }

        this._log.info(`处理邀请: ${JSON.stringify(invitations)}, ${JSON.stringify(strategies)}`)

        const availableInvitations = invitations.filter(
          (i) => i.state === 'Pending' && i.canAcceptInvitation
        )

        if (availableInvitations.length === 0) {
          return
        }

        // 先找到任意一个符合要求的, decline 或 accept 或 ignore
        const availableStrategies = availableInvitations
          .map((i) => {
            const strategy = strategies[i.gameConfig.inviteGameType]

            if (strategy) {
              return {
                id: i.invitationId,
                inviteGameType: i.gameConfig.inviteGameType,
                strategy: strategies[i.gameConfig.inviteGameType]
              }
            }

            return {
              id: i.invitationId,
              inviteGameType: i.gameConfig.inviteGameType,
              strategy: strategies['<DEFAULT>'] || 'ignore'
            }
          })
          .toSorted((a, b) => {
            if (a.strategy === 'accept' && b.strategy !== 'accept') {
              return -1
            } else if (a.strategy !== 'accept' && b.strategy === 'accept') {
              return 1
            } else if (a.strategy === 'decline' && b.strategy !== 'decline') {
              return -1
            } else if (a.strategy !== 'decline' && b.strategy === 'decline') {
              return 1
            } else {
              return 0
            }
          })

        if (availableStrategies.length === 0) {
          return
        }

        const candidate = availableStrategies[0]

        try {
          if (candidate.strategy === 'accept') {
            await this._lc.api.lobby.acceptReceivedInvitation(candidate.id)
            this._log.info(`自动处理邀请: ${candidate.id}, ${candidate.strategy}`)
          } else if (candidate.strategy === 'decline') {
            await this._lc.api.lobby.declineReceivedInvitation(candidate.id)
            this._log.info(`自动处理邀请: ${candidate.id}, ${candidate.strategy}`)
          } else {
            this._log.info(`忽略这个邀请: ${candidate.id}, ${candidate.strategy}`)
          }
        } catch (error) {
          this._log.warn(`自动处理失败: ${formatError(error)}`)
        }
      }
    )
  }

  private _handleAutoSkipLeader() {
    const leaderInfo = computed(
      () => {
        const lobby = this._lc.data.lobby.lobby

        if (!lobby) {
          return null
        }

        const isLeader = lobby.localMember.isLeader

        const targetMembers = lobby.members.filter(
          (p) => p.summonerId !== lobby.localMember.summonerId && !p.isSpectator
        )

        const readyMembers = targetMembers.filter((p) => p.ready).map((p) => p.summonerId)
        const notReadyMembers = targetMembers.filter((p) => !p.ready).map((p) => p.summonerId)

        return {
          isLeader,
          readyMembers,
          notReadyMembers
        }
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () => leaderInfo.get(),
      (info) => {
        if (!this.settings.autoSkipLeaderEnabled || !info || !info.isLeader) {
          return
        }

        if (!info.readyMembers.length && !info.notReadyMembers.length) {
          return
        }

        // 优先从 ready 的玩家中选择
        const fromMembers = info.readyMembers.length ? info.readyMembers : info.notReadyMembers
        const target = fromMembers[randomInt(0, fromMembers.length - 1)]

        this._log.info('更换房间领导者', target)

        if (this._lc.data.chat.conversations.customGame) {
          this._lc.api.chat.chatSend(
            this._lc.data.chat.conversations.customGame.id,
            i18next.t('auto-gameflow-main.skip-leader'),
            'celebration'
          )
        }

        this._lc.api.lobby.promote(target).catch((e) => {
          this._log.warn('尝试更换房间领导者时失败', e)
        })
      },
      { fireImmediately: true }
    )
  }

  /**
   * @deprecated 已无法使用
   */
  private _adjustDodgeTimer(msLeft: number, threshold: number) {
    const dodgeIn = Math.max(msLeft - threshold * 1e3, 0)
    this._log.info(`时间校正：将在 ${dodgeIn} ms 后秒退`)
    this._dodgeTask.start(dodgeIn)
    this.state.setDodgeAt(Date.now() + dodgeIn)
  }

  private _handleLastSecondDodge() {
    this._mobx.reaction(
      () => [Boolean(this._lc.data.champSelect.session), this.state.willDodgeAtLastSecond] as const,
      ([hasSession, enabled]) => {
        if (!hasSession || !enabled) {
          if (this._dodgeTask.cancel()) {
            this._log.info('预定秒退已取消')
          }
          this.state.setDodgeAt(-1)
          this.state.setWillDodgeAtLastSecond(false)
          return
        }
      },
      { equals: comparer.shallow }
    )

    this._mobx.reaction(
      () =>
        [
          this._lc.data.champSelect.session?.timer,
          this.state.willDodgeAtLastSecond,
          this.settings.dodgeAtLastSecondThreshold
        ] as const,
      ([timer, enabled, threshold]) => {
        if (timer && enabled) {
          if (timer.phase === 'FINALIZATION') {
            this._adjustDodgeTimer(timer.adjustedTimeLeftInPhase, threshold)
          }
        }
      },
      { equals: comparer.shallow }
    )
  }

  private _handleAutoBallot() {
    const honorables = computed(() => {
      if (!this._lc.data.honor.ballot) {
        return null
      }

      const {
        eligibleAllies,
        eligibleOpponents,
        gameId,
        votePool: { votes }
      } = this._lc.data.honor.ballot

      return {
        allies: eligibleAllies.filter((p) => !p.botPlayer).map((p) => p.puuid),
        opponents: eligibleOpponents.filter((p) => !p.botPlayer).map((p) => p.puuid),
        votes,
        gameId
      }
    })

    this._mobx.reaction(
      () => [honorables.get(), this.settings.autoHonorEnabled] as const,
      async ([h, enabled]) => {
        if (h && h.gameId) {
          this._playAgainTask.cancel()
        }

        if (h && h.gameId && enabled) {
          try {
            const eogStatus = (await this._lc.api.lobby.getEogStatus()).data
            const lobbyMembers = [
              ...eogStatus.eogPlayers,
              ...eogStatus.leftPlayers,
              ...eogStatus.readyPlayers
            ]

            const candidates: string[] = []

            // 1. 优先从房间中的己方成员选择
            const lobbyAllies = h.allies.filter((p) => lobbyMembers.includes(p))
            const firstBatchVotes = Math.min(h.votes, lobbyAllies.length)
            if (firstBatchVotes > 0) {
              const weights = Array(lobbyAllies.length).fill(1)
              const maker = new ChoiceMaker(weights, lobbyAllies)
              const chosenLobbyAllies = maker.choose(firstBatchVotes)
              candidates.push(...chosenLobbyAllies)
            }

            // 2. 如果还有剩余点赞数，从非房间内的己方成员中选择
            const remainingVotesAfterFirst = h.votes - candidates.length
            if (remainingVotesAfterFirst > 0) {
              const nonLobbyAllies = h.allies.filter(
                (p) => !lobbyMembers.includes(p) && !candidates.includes(p)
              )
              const secondBatchVotes = Math.min(remainingVotesAfterFirst, nonLobbyAllies.length)
              if (secondBatchVotes > 0) {
                const weights = Array(nonLobbyAllies.length).fill(1)
                const maker = new ChoiceMaker(weights, nonLobbyAllies)
                const chosenNonLobbyAllies = maker.choose(secondBatchVotes)
                candidates.push(...chosenNonLobbyAllies)
              }
            }

            // 3. 如果还有剩余点赞数，从非房间内的敌方成员中选择
            const remainingVotesAfterSecond = h.votes - candidates.length
            if (remainingVotesAfterSecond > 0) {
              const nonLobbyOpponents = h.opponents.filter(
                (p) => !lobbyMembers.includes(p) && !candidates.includes(p)
              )
              const thirdBatchVotes = Math.min(remainingVotesAfterSecond, nonLobbyOpponents.length)
              if (thirdBatchVotes > 0) {
                const weights = Array(nonLobbyOpponents.length).fill(1)
                const maker = new ChoiceMaker(weights, nonLobbyOpponents)
                const chosenNonLobbyOpponents = maker.choose(thirdBatchVotes)
                candidates.push(...chosenNonLobbyOpponents)
              }
            }

            // 对选择出的candidates进行点赞
            for (const puuid of candidates) {
              await this._lc.api.honor.honor(
                AutoGameflowMain.HONOR_CATEGORY[
                  randomInt(0, AutoGameflowMain.HONOR_CATEGORY.length)
                ],
                puuid
              )
            }

            await this._lc.api.honor.ballot()
            this._log.info(`自动点赞：给玩家 ${candidates.join(', ')} 点赞, 对局 ID: ${h.gameId}`)
          } catch (error) {
            this._ipc.sendEvent(AutoGameflowMain.id, 'error-auto-honor', formatError(error))
            this._lc.api.playerNotifications
              .createTitleDetailsNotification(
                i18next.t('common.appName'),
                i18next.t('auto-gameflow-main.error-auto-honor', {
                  reason: formatErrorMessage(error)
                })
              )
              .catch(() => {})
            this._log.warn(`自动点赞出现错误 ${formatError(error)}`)
          }
        }
      },
      {
        equals: comparer.structural,
        fireImmediately: true
      }
    )
  }

  private _handleAutoSearchMatch() {
    this._mobx.reaction(
      () => this.settings.autoMatchmakingEnabled,
      (enabled) => {
        if (!enabled) {
          this.cancelAutoMatchmaking('normal')
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => [this.state.activityStartStatus, this.settings.autoMatchmakingEnabled] as const,
      ([s, enabled]) => {
        if (!enabled) {
          this.cancelAutoMatchmaking('normal')
          return
        }

        if (s === 'can-start-activity') {
          this._log.info(`现在将在 ${this.settings.autoMatchmakingDelaySeconds} 秒后开始匹配`)
          this.state.setSearchMatchAt(Date.now() + this.settings.autoMatchmakingDelaySeconds * 1e3)
          this._autoSearchMatchTimerId = setTimeout(
            () => this._startMatchmaking(),
            this.settings.autoMatchmakingDelaySeconds * 1e3
          )

          this._sendAutoSearchMatchInfoInChat()
          this._autoSearchMatchCountdownTimerId = setInterval(
            () => this._sendAutoSearchMatchInfoInChat(),
            1000
          )
        } else if (s === 'unavailable' || s === 'cannot-start-activity') {
          this.cancelAutoMatchmaking('normal')
        } else {
          this.cancelAutoMatchmaking(s)
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )

    const simplifiedSearchState = computed(() => {
      if (!this._lc.data.matchmaking.search) {
        return null
      }

      return {
        timeInQueue: this._lc.data.matchmaking.search.timeInQueue,
        estimatedQueueTime: this._lc.data.matchmaking.search.estimatedQueueTime,
        searchState: this._lc.data.matchmaking.search.searchState,
        lowPriorityData: this._lc.data.matchmaking.search.lowPriorityData,
        isCurrentlyInQueue: this._lc.data.matchmaking.search.isCurrentlyInQueue
      }
    })

    let penaltyTime = 0
    this._mobx.reaction(
      () => Boolean(simplifiedSearchState.get()),
      (hasSearchState) => {
        if (hasSearchState) {
          penaltyTime = simplifiedSearchState.get()?.lowPriorityData.penaltyTime || 0
        } else {
          penaltyTime = 0
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () =>
        [
          simplifiedSearchState.get(),
          this.settings.autoMatchmakingRematchStrategy,
          this.settings.autoMatchmakingRematchFixedDuration
        ] as const,
      ([s, st, d]) => {
        if (st === 'never' || !s || s.searchState !== 'Searching') {
          return
        }

        if (!s.isCurrentlyInQueue) {
          return
        }

        if (st === 'fixed-duration') {
          if (s.timeInQueue - penaltyTime >= d) {
            this._lc.api.lobby.deleteSearchMatch().catch((e) => {
              this._log.warn(`尝试取消匹配时失败 ${formatError(e)}`)
            })
            return
          }
        } else if (st === 'estimated-duration') {
          if (s.timeInQueue - penaltyTime >= s.estimatedQueueTime) {
            this._lc.api.lobby.deleteSearchMatch().catch((e) => {
              this._log.warn(`尝试取消匹配时失败 ${formatError(e)}`)
            })
          }
        }
      },
      { equals: comparer.structural, fireImmediately: true }
    )
  }

  private _handlePreEndOfGame() {
    this._lc.events.on('/lol-pre-end-of-game/v1/currentSequenceEvent', async (event) => {
      if (event.data) {
        // TODO: 暂时将 missions-celebration 合并到 play-again 逻辑设置下
        if (this.settings.playAgainEnabled && event.data.name === 'missions-celebration') {
          this._log.info('PreEndOfGame currentSequenceEvent: missions-celebration，尝试完成')
          try {
            await this._lc.api.preEndOfGame.complete('missions-celebration')
          } catch (error) {
            this._log.warn(`无法完成 missions-celebration: ${formatError(error)}`)
          }
        }
      }
    })
  }

  private async _acceptMatch() {
    try {
      await this._lc.api.matchmaking.accept()
    } catch (error) {
      this._ipc.sendEvent(AutoGameflowMain.id, 'error-accept-match', formatError(error))
      this._lc.api.playerNotifications
        .createTitleDetailsNotification(
          i18next.t('common.appName'),
          i18next.t('auto-gameflow-main.error-accept-match', {
            reason: formatErrorMessage(error)
          })
        )
        .catch(() => {})
      this._log.warn(`无法接受对局`, error)
    }
    this.state.clearAutoAccept()
    this._autoSearchMatchTimerId = null
  }

  private async _startMatchmaking() {
    try {
      if (this._autoSearchMatchCountdownTimerId) {
        clearInterval(this._autoSearchMatchCountdownTimerId)
        this._autoSearchMatchCountdownTimerId = null
      }
      this.state.clearAutoSearchMatch()
      this._autoSearchMatchTimerId = null
      await this._lc.api.lobby.searchMatch()
    } catch (error) {
      this._ipc.sendEvent(AutoGameflowMain.id, 'error-matchmaking', formatError(error))
      this._lc.api.playerNotifications
        .createTitleDetailsNotification(
          i18next.t('common.appName'),
          i18next.t('auto-gameflow-main.error-matchmaking', {
            reason: formatErrorMessage(error)
          })
        )
        .catch(() => {})
      this._log.warn(`无法开始匹配`, error)
    }
  }

  private async _playAgainFn() {
    try {
      this._log.info('Play again, 返回房间')
      await this._lc.api.lobby.playAgain()
    } catch (error) {
      this._log.warn(`尝试 Play again 时失败`, error)
    }
  }

  private async _dodgeFn() {
    try {
      this._log.info('Dodge, 秒退')
      await this._lc.api.login.dodge()
    } catch (error) {
      this._log.warn(`尝试秒退时失败`, error)
    } finally {
      this.state.setDodgeAt(-1)
    }
  }

  private async _reconnectFn() {
    try {
      this._log.info('Reconnect! 尝试重新连接')
      await this._lc.api.gameflow.reconnect()
    } catch (error) {
      this._log.warn(`尝试重新连接失败`, error)
    }
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._setting.onChange('dodgeAtLastSecondThreshold', async (v, { setter }) => {
      if (v < 0) {
        v = 0
      }

      this.settings.setDodgeAtLastSecondThreshold(v)
      await setter()
    })

    this._setting.onChange('autoAcceptEnabled', async (v, { setter }) => {
      if (!v) {
        this.cancelAutoAccept('normal')
      }

      this.settings.setAutoAcceptEnabled(v)
      await setter()
    })

    this._mobx.propSync(AutoGameflowMain.id, 'settings', this.settings, [
      'autoAcceptDelaySeconds',
      'autoAcceptEnabled',
      'autoHonorEnabled',
      'autoHonorStrategy',
      'autoMatchmakingDelaySeconds',
      'autoMatchmakingEnabled',
      'autoMatchmakingMinimumMembers',
      'autoMatchmakingRematchFixedDuration',
      'autoMatchmakingRematchStrategy',
      'autoMatchmakingWaitForInvitees',
      'autoSkipLeaderEnabled',
      'playAgainEnabled',
      'dodgeAtLastSecondThreshold',
      'autoHandleInvitationsEnabled',
      'autoReconnectEnabled',
      'autoMatchmakingMaximumMatchDuration',
      'invitationHandlingStrategies',
      'rejectInvitationWhenAway'
    ])

    this._mobx.propSync(AutoGameflowMain.id, 'state', this.state, [
      'willAccept',
      'willAcceptAt',
      'willSearchMatch',
      'willSearchMatchAt',
      'activityStartStatus',
      'willDodgeAt',
      'willDodgeAtLastSecond'
    ])
  }

  cancelAutoAccept(reason?: string) {
    if (this.state.willAccept) {
      if (this._autoAcceptTimerId) {
        clearTimeout(this._autoAcceptTimerId)
        this._autoAcceptTimerId = null
        if (reason === 'accepted') {
          this._log.info(`取消了即将进行的接受 - 已经被接受`)
        } else if (reason === 'declined') {
          this._log.info(`取消了即将进行的接受 - 已经被拒绝`)
        } else {
          this._log.info(`取消了即将进行的接受`)
        }
      }
      this.state.clearAutoAccept()
    }
  }

  cancelAutoMatchmaking(reason?: string) {
    if (this.state.willSearchMatch) {
      if (this._autoSearchMatchTimerId) {
        clearTimeout(this._autoSearchMatchTimerId)
        this._autoSearchMatchTimerId = null
      }
      if (this._autoSearchMatchCountdownTimerId) {
        this._sendAutoSearchMatchInfoInChat(reason)
        clearInterval(this._autoSearchMatchCountdownTimerId)
        this._autoSearchMatchCountdownTimerId = null
      }

      this.state.clearAutoSearchMatch()
      this._log.info(`即将进行的自动匹配对局已取消，${reason || '未知'}`)
    }
  }

  private _sendAutoSearchMatchInfoInChat = async (cancel?: string) => {
    if (this._lc.data.chat.conversations.customGame && this.state.willSearchMatch) {
      if (cancel === 'normal') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'waiting-for-invitee') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-wait-for-invitees')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'not-the-leader') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-not-leader')}`,
            'celebration'
          )
          .catch(() => {})
        return
      } else if (cancel === 'waiting-for-penalty-time') {
        this._lc.api.chat
          .chatSend(
            this._lc.data.chat.conversations.customGame.id,
            `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-canceled-wait-for-penalty')}`,
            'celebration'
          )
          .catch(() => {})
        return
      }

      const time = (this.state.willSearchMatchAt - Date.now()) / 1e3
      this._lc.api.chat
        .chatSend(
          this._lc.data.chat.conversations.customGame.id,
          `[League Akari] ${i18next.t('auto-gameflow-main.auto-matchmaking-in', { seconds: Math.abs(time).toFixed() })}`,
          'celebration'
        )
        .catch(() => {})
    }
  }

  async onInit() {
    await this._handleState()
    this._handleIpcCall()
    this._handleAutoBallot()
    this._handleAutoAccept()
    this._handleAutoPlayAgain()
    this._handleAutoReconnect()
    this._handleAutoHandleInvitation()
    this._handleAutoSkipLeader()
    this._handleLogging()
    this._handleLastSecondDodge()
    this._handleAutoSearchMatch()
    this._handlePreEndOfGame()
  }

  async onDispose() {}
}
