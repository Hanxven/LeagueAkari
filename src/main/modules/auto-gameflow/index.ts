import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { chatSend } from '@main/http-api/chat'
import { honor } from '@main/http-api/honor-v2'
import { deleteSearchMatch, getEogStatus, playAgain, searchMatch } from '@main/http-api/lobby'
import { accept } from '@main/http-api/matchmaking'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { TimeoutTask } from '@main/utils/timer'
import { formatError } from '@shared/utils/errors'
import { comparer, computed } from 'mobx'

import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { AppLogger, LogModule } from '../akari-core/log'
import { MainWindowModule } from '../akari-core/main-window'
import { LcuSyncModule } from '../lcu-state-sync'
import { AutoGameflowState } from './state'

/**
 * 自动游戏流相关功能模块
 */
export class AutoGameflowModule extends MobxBasedBasicModule {
  public state = new AutoGameflowState()

  private _logger: AppLogger
  private _lcm: LcuConnectionModule
  private _lcu: LcuSyncModule
  private _mwm: MainWindowModule

  private _autoAcceptTimerId: NodeJS.Timeout | null = null
  private _autoSearchMatchTimerId: NodeJS.Timeout | null = null
  private _autoSearchMatchCountdownTimerId: NodeJS.Timeout | null = null

  private _playAgainTask = new TimeoutTask(() => this._playAgainFn())

  static HONOR_CATEGORY = ['COOL', 'SHOTCALLER', 'HEART'] as const

  static PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT = 3250
  static PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT = 10000
  static PLAY_AGAIN_BUFFER_TIMEOUT = 1575

  constructor() {
    super('auto-gameflow')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('auto-gameflow')
    this._lcu = this.manager.getModule('lcu-state-sync')
    this._lcm = this.manager.getModule('lcu-connection')
    this._mwm = this.manager.getModule('main-window')

    await this._loadSettings()

    this._setupSettingsSync()
    this._setupStateSync()
    this._setupMethodCall()
    this._handleAutoBallot()
    this._handleAutoAccept()
    this._handleAutoSearchMatch()
    this._handleAutoPlayAgain()

    this._logger.info('初始化完成')
  }

  private _setupSettingsSync() {
    this.simpleSync('settings/auto-honor-enabled', () => this.state.settings.autoHonorEnabled)
    this.simpleSync('settings/auto-honor-strategy', () => this.state.settings.autoHonorStrategy)
    this.simpleSync('settings/play-again-enabled', () => this.state.settings.playAgainEnabled)
    this.simpleSync('settings/auto-accept-enabled', () => this.state.settings.autoAcceptEnabled)
    this.simpleSync(
      'settings/auto-accept-delay-seconds',
      () => this.state.settings.autoAcceptDelaySeconds
    )
    this.simpleSync(
      'settings/auto-search-match-enabled',
      () => this.state.settings.autoSearchMatchEnabled
    )
    this.simpleSync(
      'settings/auto-search-match-delay-seconds',
      () => this.state.settings.autoSearchMatchDelaySeconds
    )
    this.simpleSync(
      'settings/auto-search-match-minimum-members',
      () => this.state.settings.autoSearchMatchMinimumMembers
    )
    this.simpleSync(
      'settings/auto-search-match-wait-for-invitees',
      () => this.state.settings.autoSearchMatchWaitForInvitees
    )
    this.simpleSync(
      'settings/auto-search-match-rematch-strategy',
      () => this.state.settings.autoSearchMatchRematchStrategy
    )
    this.simpleSync(
      'settings/auto-search-match-rematch-fixed-duration',
      () => this.state.settings.autoSearchMatchRematchFixedDuration
    )
  }

  private _setupStateSync() {
    this.simpleSync('will-accept', () => this.state.willAccept)
    this.simpleSync('will-accept-at', () => this.state.willAcceptAt)
    this.simpleSync('will-search-match', () => this.state.willSearchMatch)
    this.simpleSync('will-search-match-at', () => this.state.willSearchMatchAt)
    this.simpleSync('activity-start-status', () => this.state.activityStartStatus)
  }

  private async _loadSettings() {
    this.state.settings.setAutoHonorEnabled(
      await this._sm.settings.get(
        'auto-gameflow/auto-honor-enabled',
        this.state.settings.autoHonorEnabled
      )
    )

    this.state.settings.setAutoHonorStrategy(
      await this._sm.settings.get(
        'auto-gameflow/auto-honor-strategy',
        this.state.settings.autoHonorStrategy
      )
    )

    this.state.settings.setPlayAgainEnabled(
      await this._sm.settings.get(
        'auto-gameflow/play-again-enabled',
        this.state.settings.playAgainEnabled
      )
    )

    this.state.settings.setAutoAcceptEnabled(
      await this._sm.settings.get(
        'auto-gameflow/auto-accept-enabled',
        this.state.settings.autoAcceptEnabled
      )
    )

    this.state.settings.setAutoAcceptDelaySeconds(
      await this._sm.settings.get(
        'auto-gameflow/auto-accept-delay-seconds',
        this.state.settings.autoAcceptDelaySeconds
      )
    )

    this.state.settings.setAutoAcceptDelaySeconds(
      await this._sm.settings.get(
        'auto-gameflow/auto-accept-delay-seconds',
        this.state.settings.autoAcceptDelaySeconds
      )
    )

    this.state.settings.setAutoSearchMatchEnabled(
      await this._sm.settings.get(
        'auto-gameflow/auto-search-match-enabled',
        this.state.settings.autoSearchMatchEnabled
      )
    )

    this.state.settings.setAutoSearchMatchDelaySeconds(
      await this._sm.settings.get(
        'auto-gameflow/auto-search-match-delay-seconds',
        this.state.settings.autoSearchMatchDelaySeconds
      )
    )

    this.state.settings.setAutoSearchMatchMinimumMembers(
      await this._sm.settings.get(
        'auto-gameflow/auto-search-minimum-members',
        this.state.settings.autoSearchMatchMinimumMembers
      )
    )

    this.state.settings.setAutoSearchMatchWaitForInvitees(
      await this._sm.settings.get(
        'auto-gameflow/auto-search-wait-for-invitees',
        this.state.settings.autoSearchMatchWaitForInvitees
      )
    )

    this.state.settings.setAutoSearchMatchRematchStrategy(
      await this._sm.settings.get(
        'auto-gameflow/auto-search-match-rematch-strategy',
        this.state.settings.autoSearchMatchRematchStrategy
      )
    )

    this.state.settings.setAutoSearchMatchRematchFixedDuration(
      await this._sm.settings.get(
        'auto-gameflow/auto-search-match-rematch-fixed-duration',
        this.state.settings.autoSearchMatchRematchFixedDuration
      )
    )
  }

  private _setupMethodCall() {
    this.onCall('set-setting/auto-honor-enabled', async (value) => {
      this.state.settings.setAutoHonorEnabled(value)
      await this._sm.settings.set('auto-gameflow/auto-honor-enabled', value)
    })
    this.onCall('set-setting/auto-honor-strategy', async (value) => {
      this.state.settings.setAutoHonorStrategy(value)
      await this._sm.settings.set('auto-gameflow/auto-honor-strategy', value)
    })
    this.onCall('set-setting/play-again-enabled', async (value) => {
      this.state.settings.setPlayAgainEnabled(value)
      await this._sm.settings.set('auto-gameflow/play-again-enabled', value)
    })
    this.onCall('set-setting/auto-accept-enabled', async (value) => {
      if (!value) {
        this.cancelAutoAccept('normal')
      }

      this.state.settings.setAutoAcceptEnabled(value)
      await this._sm.settings.set('auto-gameflow/auto-accept-enabled', value)
    })
    this.onCall('set-setting/auto-accept-delay-seconds', async (value) => {
      this.state.settings.setAutoAcceptDelaySeconds(value)
      await this._sm.settings.set('auto-gameflow/auto-accept-delay-seconds', value)
    })
    this.onCall('set-setting/auto-search-match-enabled', async (value) => {
      this.state.settings.setAutoSearchMatchEnabled(value)
      await this._sm.settings.set('auto-gameflow/auto-search-match-enabled', value)
    })
    this.onCall('set-setting/auto-search-match-delay-seconds', async (value) => {
      this.state.settings.setAutoSearchMatchDelaySeconds(value)
      await this._sm.settings.set('auto-gameflow/auto-search-match-delay-seconds', value)
    })
    this.onCall('set-setting/auto-search-match-minimum-members', async (value) => {
      this.state.settings.setAutoSearchMatchMinimumMembers(value)
      await this._sm.settings.set('auto-gameflow/auto-search-minimum-members', value)
    })
    this.onCall('set-setting/auto-search-match-wait-for-invitees', async (value) => {
      this.state.settings.setAutoSearchMatchWaitForInvitees(value)
      await this._sm.settings.set('auto-gameflow/auto-search-match-wait-for-invitees', value)
    })
    this.onCall('set-setting/auto-search-match-rematch-strategy', async (value) => {
      this.state.settings.setAutoSearchMatchRematchStrategy(value)
      await this._sm.settings.set('auto-gameflow/auto-search-match-rematch-strategy', value)
    })
    this.onCall('set-setting/auto-search-match-rematch-fixed-duration', async (value) => {
      this.state.settings.setAutoSearchMatchRematchFixedDuration(value)
      await this._sm.settings.set('auto-gameflow/auto-search-match-rematch-fixed-duration', value)
    })
    this.onCall('cancel-auto-accept', () => {
      this.cancelAutoAccept('normal')
    })
    this.onCall('cancel-auto-search-match', () => {
      this.cancelAutoSearchMatch('normal')
    })
  }

  cancelAutoAccept(reason?: string) {
    if (this.state.willAccept) {
      if (this._autoAcceptTimerId) {
        clearTimeout(this._autoAcceptTimerId)
        this._autoAcceptTimerId = null
      }
      this.state.clearAutoAccept()
      if (reason === 'accepted') {
        this._logger.info(`取消了即将进行的接受 - 已完成`)
      } else if (reason === 'declined') {
        this._logger.info(`取消了即将进行的接受 - 已完成`)
      } else {
        this._logger.info(`取消了即将进行的接受`)
      }
    }
  }

  cancelAutoSearchMatch(reason?: string) {
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
      this._logger.info(`即将进行的自动匹配对局已取消，${reason || '未知'}`)
    }
  }

  private _sendAutoSearchMatchInfoInChat = async (cancel?: string) => {
    if (this._lcu.chat.conversations.customGame && this.state.willSearchMatch) {
      if (cancel === 'normal') {
        chatSend(
          this._lcu.chat.conversations.customGame.id,
          `[League Akari] 自动匹配已取消`,
          'celebration'
        ).catch()
        return
      } else if (cancel === 'waiting-for-invitee') {
        chatSend(
          this._lcu.chat.conversations.customGame.id,
          `[League Akari] 自动匹配已取消，等待被邀请者`,
          'celebration'
        ).catch()
        return
      } else if (cancel === 'not-the-leader') {
        chatSend(
          this._lcu.chat.conversations.customGame.id,
          `[League Akari] 自动匹配已取消，当前不是房间房主`,
          'celebration'
        ).catch()
        return
      } else if (cancel === 'waiting-for-penalty-time') {
        chatSend(
          this._lcu.chat.conversations.customGame.id,
          `[League Akari] 自动匹配已取消，等待秒退计时器`,
          'celebration'
        ).catch()
        return
      }

      const time = (this.state.willSearchMatchAt - Date.now()) / 1e3
      chatSend(
        this._lcu.chat.conversations.customGame.id,
        `[League Akari] 将在 ${Math.abs(time).toFixed()} 秒后自动匹配`,
        'celebration'
      ).catch()
    }
  }

  private async _acceptMatch() {
    try {
      await accept()
    } catch (error) {
      this._mwm.notify.warn('auto-gameflow', '自动接受', '尝试接受对局时出现问题')
      this._logger.warn(`无法接受对局 ${formatError(error)}`)
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
      await searchMatch()
    } catch (error) {
      this._mwm.notify.warn('auto-gameflow', '自动匹配', '尝试开始匹配时出现问题')
      this._logger.warn(`无法开始匹配 ${formatError(error)}`)
    }
  }

  private async _playAgainFn() {
    try {
      this._logger.info('Play again, 返回房间')
      await playAgain()
    } catch (error) {
      this._logger.warn(`尝试 Play again 时失败 ${formatError(error)}`)
    }
  }

  private _handleAutoBallot() {
    this.autoDisposeReaction(
      () => [this._lcu.honor.ballot, this.state.settings.autoHonorEnabled] as const,
      async ([b, e]) => {
        if (b) {
          this._playAgainTask.cancel()
        }

        if (b && e) {
          try {
            if (this.state.settings.autoHonorStrategy === 'opt-out') {
              await honor(b.gameId, 'OPT_OUT', 0)
              return
            }

            const eligibleAllies = b.eligibleAllies
            const eligibleOpponents = b.eligibleOpponents
            const honorablePlayerIds: number[] = []

            if (this.state.settings.autoHonorStrategy === 'all-member') {
              honorablePlayerIds.push(...eligibleAllies.map((p) => p.summonerId))
            } else if (this.state.settings.autoHonorStrategy === 'all-member-including-opponent') {
              honorablePlayerIds.push(...eligibleAllies.map((p) => p.summonerId))
              honorablePlayerIds.push(...eligibleOpponents.map((p) => p.summonerId))
            } else {
              const eligiblePlayerIds = new Set(eligibleAllies.map((p) => p.summonerId))
              const eogStatus = (await getEogStatus()).data
              const lobbyMemberPuuids = [
                ...eogStatus.eogPlayers,
                ...eogStatus.leftPlayers,
                ...eogStatus.readyPlayers
              ]
              const lobbyMemberSummoners = (
                await Promise.all(
                  lobbyMemberPuuids.map(async (p) => (await getSummonerByPuuid(p)).data)
                )
              ).filter((p) => p.summonerId !== this._lcu.summoner.me?.summonerId)

              const honorableLobbyMembers = lobbyMemberSummoners.filter((p) =>
                eligiblePlayerIds.has(p.summonerId)
              )

              if (this.state.settings.autoHonorStrategy === 'only-lobby-member') {
                honorablePlayerIds.push(...honorableLobbyMembers.map((p) => p.summonerId))
              } else if (this.state.settings.autoHonorStrategy === 'prefer-lobby-member') {
                if (honorableLobbyMembers.length === 0) {
                  honorablePlayerIds.push(...eligibleAllies.map((p) => p.summonerId))
                } else {
                  honorablePlayerIds.push(...honorableLobbyMembers.map((p) => p.summonerId))
                }
              }
            }

            if (honorablePlayerIds.length) {
              const category =
                AutoGameflowModule.HONOR_CATEGORY[
                  Math.floor(Math.random() * AutoGameflowModule.HONOR_CATEGORY.length)
                ]
              const candidate =
                honorablePlayerIds[Math.floor(Math.random() * honorablePlayerIds.length)]

              await honor(b.gameId, category, candidate)

              this._logger.info(`给玩家: ${candidate} 点赞, for ${category}, game ID: ${b.gameId}`)
            } else {
              await honor(b.gameId, 'OPT_OUT', 0)
              this._logger.info('跳过点赞阶段')
            }
          } catch (error) {
            this._mwm.notify.warn('auto-gameflow', '自动点赞', '尝试自动点赞出现问题')
            this._logger.warn(`无法给玩家点赞 ${formatError(error)}`)
          }
        }
      },
      {
        equals: comparer.shallow /* ballot 不会 Update，只会 Create 和 Delete */,
        fireImmediately: true
      }
    )
  }

  private _handleAutoSearchMatch() {
    this.autoDisposeReaction(
      () => this.state.settings.autoSearchMatchEnabled,
      (enabled) => {
        if (!enabled) {
          this.cancelAutoSearchMatch('normal')
        }
      },
      { fireImmediately: true }
    )

    this.autoDisposeReaction(
      () => [this.state.activityStartStatus, this.state.settings.autoSearchMatchEnabled] as const,
      ([s, enabled]) => {
        if (!enabled) {
          this.cancelAutoSearchMatch('normal')
          return
        }

        if (s === 'can-start-activity') {
          this._logger.info(
            `现在将在 ${this.state.settings.autoSearchMatchDelaySeconds} 秒后开始匹配`
          )
          this.state.setSearchMatchAt(
            Date.now() + this.state.settings.autoSearchMatchDelaySeconds * 1e3
          )
          this._autoSearchMatchTimerId = setTimeout(
            () => this._startMatchmaking(),
            this.state.settings.autoSearchMatchDelaySeconds * 1e3
          )

          this._sendAutoSearchMatchInfoInChat()
          this._autoSearchMatchCountdownTimerId = setInterval(
            () => this._sendAutoSearchMatchInfoInChat(),
            1000
          )
        } else if (s === 'unavailable' || s === 'cannot-start-activity') {
          this.cancelAutoSearchMatch('normal')
        } else {
          this.cancelAutoSearchMatch(s)
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )

    const simplifiedSearchState = computed(() => {
      if (!this._lcu.matchmaking.search) {
        return null
      }

      return {
        timeInQueue: this._lcu.matchmaking.search.timeInQueue,
        estimatedQueueTime: this._lcu.matchmaking.search.estimatedQueueTime,
        searchState: this._lcu.matchmaking.search.searchState,
        lowPriorityData: this._lcu.matchmaking.search.lowPriorityData,
        isCurrentlyInQueue: this._lcu.matchmaking.search.isCurrentlyInQueue
      }
    })

    let penaltyTime = 0
    this.autoDisposeReaction(
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

    this.autoDisposeReaction(
      () =>
        [
          simplifiedSearchState.get(),
          this.state.settings.autoSearchMatchRematchStrategy,
          this.state.settings.autoSearchMatchRematchFixedDuration
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
            deleteSearchMatch().catch((e) => {
              this._logger.warn(`尝试取消匹配时失败 ${formatError(e)}`)
            })
            return
          }
        } else if (st === 'estimated-duration') {
          if (s.timeInQueue - penaltyTime >= s.estimatedQueueTime) {
            deleteSearchMatch().catch((e) => {
              this._logger.warn(`尝试取消匹配时失败 ${formatError(e)}`)
            })
          }
        }
      },
      { equals: comparer.structural, fireImmediately: true }
    )
  }

  private _handleAutoAccept() {
    this.autoDisposeReaction(
      () => this._lcu.gameflow.phase,
      (phase) => {
        if (!this.state.settings.autoAcceptEnabled) {
          return
        }

        if (phase === 'ReadyCheck') {
          this.state.setAcceptAt(Date.now() + this.state.settings.autoAcceptDelaySeconds * 1e3)
          this._autoAcceptTimerId = setTimeout(
            () => this._acceptMatch(),
            this.state.settings.autoAcceptDelaySeconds * 1e3
          )

          this._logger.info(
            `ReadyCheck! 即将在 ${this.state.settings.autoAcceptDelaySeconds} 秒后接受对局`
          )
        } else {
          if (this._autoAcceptTimerId) {
            if (this.state.willAccept) {
              this._logger.info(`取消了即将进行的接受操作 - 不在游戏 ReadyCheck 过程中`)
            }

            clearTimeout(this._autoAcceptTimerId)
            this._autoAcceptTimerId = null
          }
          this.state.clearAutoAccept()
        }
      },
      { fireImmediately: true }
    )

    this.autoDisposeReaction(
      () => this.state.settings.autoAcceptEnabled,
      (enabled) => {
        if (!enabled) {
          this.cancelAutoAccept('normal')
        }
      },
      { fireImmediately: true }
    )

    this._lcm.lcuEventBus.on('/lol-matchmaking/v1/ready-check', (event) => {
      if (
        event.data &&
        (event.data.playerResponse === 'Declined' || event.data.playerResponse === 'Accepted')
      ) {
        this.cancelAutoAccept('declined')
      }
    })
  }

  private _handleAutoPlayAgain() {
    this.autoDisposeReaction(
      () => [this._lcu.gameflow.phase, this.state.settings.playAgainEnabled] as const,
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
          this._logger.info(
            `位于 WaitingForStats，等待 ${AutoGameflowModule.PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT} ms`
          )
          this._playAgainTask.start(AutoGameflowModule.PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT)
          return
        }

        // 在某些模式中，可能会出现仅有 PreEndOfGame 的情况，需要做一个计时器
        if (phase === 'PreEndOfGame' && enabled) {
          this._logger.info(
            `等待点赞事件 ${AutoGameflowModule.PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT} ms`
          )
          this._playAgainTask.start(AutoGameflowModule.PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT)
          return
        }

        if (phase === 'EndOfGame' && enabled) {
          this._logger.info(`将在 ${AutoGameflowModule.PLAY_AGAIN_BUFFER_TIMEOUT} ms 后回到房间`)
          this._playAgainTask.start(AutoGameflowModule.PLAY_AGAIN_BUFFER_TIMEOUT)
          return
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }
}

export const autoGameflowModule = new AutoGameflowModule()
