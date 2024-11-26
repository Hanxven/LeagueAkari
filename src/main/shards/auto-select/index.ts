import { i18next } from '@main/i18n'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { formatError, formatErrorMessage } from '@shared/utils/errors'
import { comparer, computed } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoSelectSettings, AutoSelectState } from './state'

export class AutoSelectMain implements IAkariShardInitDispose {
  static id = 'auto-select-main'
  static dependencies = [
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main',
    'akari-ipc-main',
    'mobx-utils-main'
  ]

  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _lc: LeagueClientMain
  private readonly _setting: SetterSettingService
  private readonly _mobx: MobxUtilsMain
  private readonly _ipc: AkariIpcMain

  public readonly settings = new AutoSelectSettings()
  public readonly state: AutoSelectState

  private _grabTimerId: NodeJS.Timeout | null = null

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(AutoSelectMain.id)
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._settingFactory = deps['setting-factory-main']
    this.state = new AutoSelectState(this._lc.data, this.settings)
    this._setting = this._settingFactory.create(
      AutoSelectMain.id,
      {
        benchExpectedChampions: { default: this.settings.benchExpectedChampions },
        expectedChampions: { default: this.settings.expectedChampions },
        bannedChampions: { default: this.settings.bannedChampions },
        normalModeEnabled: { default: this.settings.normalModeEnabled },
        selectTeammateIntendedChampion: { default: this.settings.selectTeammateIntendedChampion },
        showIntent: { default: this.settings.showIntent },
        completed: { default: this.settings.completed },
        benchModeEnabled: { default: this.settings.benchModeEnabled },
        benchSelectFirstAvailableChampion: {
          default: this.settings.benchSelectFirstAvailableChampion
        },
        grabDelaySeconds: { default: this.settings.grabDelaySeconds },
        banEnabled: { default: this.settings.banEnabled },
        banTeammateIntendedChampion: { default: this.settings.banTeammateIntendedChampion }
      },
      this.settings
    )
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(AutoSelectMain.id, 'settings', this.settings, [
      'normalModeEnabled',
      'selectTeammateIntendedChampion',
      'showIntent',
      'completed',
      'benchModeEnabled',
      'benchSelectFirstAvailableChampion',
      'grabDelaySeconds',
      'banEnabled',
      'banTeammateIntendedChampion',
      'benchExpectedChampions',
      'expectedChampions',
      'bannedChampions'
    ])

    this._mobx.propSync(AutoSelectMain.id, 'state', this.state, [
      'upcomingBan',
      'upcomingPick',
      'upcomingGrab',
      'memberMe'
    ])
  }

  async onInit() {
    await this._handleState()
    this._handleAutoPickBan()
    this._handleBenchMode()
  }

  private _handleAutoPickBan() {
    this._mobx.reaction(
      () => this.state.upcomingPick,
      async (pick) => {
        if (!pick) {
          return
        }

        if (pick.isActingNow && pick.action.isInProgress) {
          if (
            !this.settings.completed &&
            this.state.champSelectActionInfo?.memberMe.championId === pick.championId
          ) {
            return
          }

          try {
            this._log.info(
              `现在选择：${pick.championId}, ${this.settings.completed}, actionId=${pick.action.id}`
            )

            await this._lc.api.champSelect.pickOrBan(
              pick.championId,
              this.settings.completed,
              'pick',
              pick.action.id
            )
          } catch (error) {
            this._ipc.sendEvent(AutoSelectMain.id, 'error-pick', pick.championId)
            this._lc.api.playerNotifications
              .createTitleDetailsNotification(
                i18next.t('common.appName'),
                i18next.t('error-pick', {
                  champion:
                    this._lc.data.gameData.champions[pick.championId]?.name || pick.championId,
                  reason: formatErrorMessage(error)
                })
              )
              .catch(() => {})
            this._log.warn(`尝试自动执行 pick 时失败, 目标英雄: ${pick.championId}`, error)
          }

          return
        }

        if (!pick.isActingNow) {
          if (!this.settings.showIntent) {
            return
          }

          if (this.state.champSelectActionInfo?.session.isCustomGame) {
            return
          }

          if (this.state.champSelectActionInfo?.memberMe.championId) {
            return
          }

          const thatAction = this.state.champSelectActionInfo?.pick.find(
            (a) => a.id === pick.action.id
          )
          if (thatAction && thatAction.championId === pick.championId) {
            return
          }

          try {
            this._log.info(`现在预选：${pick.championId}, actionId=${pick.action.id}`)

            await this._lc.api.champSelect.action(pick.action.id, { championId: pick.championId })
          } catch (error) {
            this._ipc.sendEvent(AutoSelectMain.id, 'error-pre-pick', pick.championId)
            this._lc.api.playerNotifications
              .createTitleDetailsNotification(
                i18next.t('common.appName'),
                i18next.t('error-pre-pick', {
                  champion:
                    this._lc.data.gameData.champions[pick.championId]?.name || pick.championId,
                  reason: formatErrorMessage(error)
                })
              )
              .catch(() => {})
            this._log.warn(`尝试自动执行预选时失败, 目标英雄: ${pick.championId}`, error)
          }
          return
        }
      }
    )

    this._mobx.reaction(
      () => this.state.upcomingBan,
      async (ban) => {
        if (!ban) {
          return
        }

        if (ban.action.isInProgress && ban.isActingNow) {
          try {
            await this._lc.api.champSelect.pickOrBan(ban.championId, true, 'ban', ban.action.id)
          } catch (error) {
            this._ipc.sendEvent(AutoSelectMain.id, 'error-ban', ban.championId)
            this._lc.api.playerNotifications
              .createTitleDetailsNotification(
                i18next.t('common.appName'),
                i18next.t('error-ban', {
                  champion:
                    this._lc.data.gameData.champions[ban.championId]?.name || ban.championId,
                  reason: formatErrorMessage(error)
                })
              )
              .catch(() => {})
            this._log.warn(`尝试自动执行 pick 时失败, 目标英雄: ${ban.championId}`, error)
          }
        }
      }
    )

    this._mobx.reaction(
      () => this.state.upcomingPick,
      (pick) => {
        this._log.info(`Upcoming Pick - 即将进行的选择: ${JSON.stringify(pick)}`)
      }
    )

    this._mobx.reaction(
      () => this.state.upcomingBan,
      (ban) => {
        this._log.info(`Upcoming Ban - 即将进行的禁用: ${JSON.stringify(ban)}`)
      }
    )

    this._mobx.reaction(
      () => this.state.upcomingGrab,
      (grab) => {
        this._log.info(`Upcoming Grab - 即将进行的交换: ${JSON.stringify(grab)}`)
      }
    )

    // for logging only
    const positionInfo = computed(
      () => {
        if (!this.state.champSelectActionInfo) {
          return null
        }

        if (!this.settings.normalModeEnabled || !this.settings.banEnabled) {
          return null
        }

        const position = this.state.champSelectActionInfo.memberMe.assignedPosition

        const championsBan = this.settings.bannedChampions
        const championsPick = this.settings.expectedChampions

        return {
          position,
          ban: championsBan,
          pick: championsPick
        }
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () => positionInfo.get(),
      (info) => {
        if (info) {
          this._log.info(
            `当前分配到位置: ${info.position || '<空>'}, 预设选用英雄: ${JSON.stringify(info.pick)}, 预设禁用英雄: ${JSON.stringify(info.ban)}`
          )
        }
      }
    )

    this._mobx.reaction(
      () => this._lc.data.chat.conversations.championSelect?.id,
      (id) => {
        if (id && this._lc.data.gameflow.phase === 'ChampSelect') {
          if (!this._lc.data.champSelect.session) {
            return
          }

          const texts: string[] = []
          if (!this._lc.data.champSelect.session.benchEnabled && this.settings.normalModeEnabled) {
            texts.push('普通模式自动选择已开启')
          }

          if (this._lc.data.champSelect.session.benchEnabled && this.settings.benchModeEnabled) {
            texts.push('随机模式自动选择已开启')
          }

          if (!this._lc.data.champSelect.session.benchEnabled && this.settings.banEnabled) {
            let hasBanAction = false
            for (const arr of this._lc.data.champSelect.session.actions) {
              if (arr.findIndex((a) => a.type === 'ban') !== -1) {
                hasBanAction = true
                break
              }
            }
            if (hasBanAction) {
              texts.push('自动禁用已开启')
            }
          }

          if (texts.length) {
            this._lc.api.chat
              .chatSend(id, `[League Akari] ${texts.join(', ')}`, 'celebration')
              .catch(() => {})
          }
        }
      }
    )
  }

  private _handleBenchMode() {
    interface BenchChampionInfo {
      // 最近一次在英雄选择台上的时间
      lastTimeOnBench: number
    }

    // 追踪了英雄选择信息的细节 k = 英雄 ID，v = 英雄信息
    const benchChampions = new Map<number, BenchChampionInfo>()

    const diffBenchAndUpdate = (prevBench: number[], newBench: number[], time: number) => {
      // 多出来的英雄，新的有但上一次没有
      newBench.forEach((c) => {
        if (!prevBench.includes(c)) {
          benchChampions.set(c, { lastTimeOnBench: time })
        }
      })

      // 消失的英雄，旧的有但新的没有
      prevBench.forEach((c) => {
        if (!newBench.includes(c)) {
          benchChampions.delete(c)
        }
      })
    }

    const simplifiedCsSession = computed(() => {
      if (!this._lc.data.champSelect.session) {
        return null
      }

      const { benchEnabled, localPlayerCellId, benchChampions, myTeam } =
        this._lc.data.champSelect.session

      return { benchEnabled, localPlayerCellId, benchChampions, myTeam }
    })

    this._mobx.reaction(
      () =>
        [
          simplifiedCsSession.get(),
          this.settings.benchExpectedChampions,
          this.settings.benchModeEnabled,
          this.settings.benchSelectFirstAvailableChampion
        ] as const,
      ([session, expected, enabled, onlyFirst], [prevSession]) => {
        if (!session) {
          // session 被清空的情况, 区分一开始就没有的情况
          if (prevSession) {
            benchChampions.clear()
          }
          return
        }

        if (!session.benchEnabled) {
          return
        }

        // Diff
        const now = Date.now()
        diffBenchAndUpdate(
          prevSession?.benchChampions.map((c) => c.championId) || [],
          session.benchChampions.map((c) => c.championId),
          now
        )

        if (!enabled) {
          if (this.state.upcomingGrab) {
            this._log.info(
              `关闭了该功能, 取消即将进行的交换：ID：${this.state.upcomingGrab.championId}`
            )
            this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
            clearTimeout(this._grabTimerId!)
            this._grabTimerId = null
            this.state.setUpcomingGrab(null)
          }
          return
        }

        // 当前会话中可选的英雄
        const availableExpectedChampions = expected.filter(
          (c) =>
            this._lc.data.champSelect.currentPickableChampionIds.has(c) &&
            !this._lc.data.champSelect.disabledChampionIds.has(c)
        )
        const pickableChampionsOnBench = availableExpectedChampions.filter((c) =>
          benchChampions.has(c)
        )

        // 本次变更, 如果有即将进行的交换, 则根据情况判断是否应该取消
        if (this.state.upcomingGrab) {
          if (pickableChampionsOnBench.length === 0) {
            this._log.info(
              `已无可选英雄, 取消即将进行的交换：ID：${this.state.upcomingGrab.championId}`
            )
            this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
            clearTimeout(this._grabTimerId!)
            this._grabTimerId = null
            this.state.setUpcomingGrab(null)
            return
          }

          if (onlyFirst) {
            // 对于 onlyFirst 的情况, 如果预计的英雄仍位于可选的第一位, 那么就返回
            if (pickableChampionsOnBench[0] === this.state.upcomingGrab.championId) {
              return
            } else {
              this._log.info(
                `已非首选英雄, 取消即将进行的交换：ID：${this.state.upcomingGrab.championId}`
              )
              this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
              clearTimeout(this._grabTimerId!)
              this._grabTimerId = null
              this.state.setUpcomingGrab(null)
            }
          } else {
            // 对于非 onlyFirst 的情况, 只要目标还在期望列表中，且仍在选择台中, 那么直接返回
            if (pickableChampionsOnBench.includes(this.state.upcomingGrab.championId)) {
              return
            } else {
              this._log.info(
                `已不在期望列表中, 取消即将进行的交换：ID：${this.state.upcomingGrab.championId}`
              )
              this._notifyInChat('cancel', this.state.upcomingGrab.championId).catch(() => {})
              clearTimeout(this._grabTimerId!)
              this._grabTimerId = null
              this.state.setUpcomingGrab(null)
            }
          }
        }

        if (pickableChampionsOnBench.length === 0) {
          return
        }

        const selfChampionId = session.myTeam.find(
          (v) => v.cellId === session.localPlayerCellId
        )?.championId

        if (!selfChampionId) {
          return
        }

        if (onlyFirst) {
          // 对于 onlyFirst, 如果手上的英雄优先级比较高, 那么没有必要再次选择
          const indexInHand = availableExpectedChampions.indexOf(selfChampionId)
          const indexInFirstPickable = availableExpectedChampions.indexOf(
            pickableChampionsOnBench[0]
          )

          if (indexInHand !== -1 && indexInHand < indexInFirstPickable) {
            return
          }
        } else {
          // 对于非 onlyFirst, 如果自己的英雄在期望列表中, 那么没有必要再次选择
          if (availableExpectedChampions.includes(selfChampionId)) {
            return
          }
        }

        const newTarget = pickableChampionsOnBench[0]
        const waitTime = Math.max(
          this.settings.grabDelaySeconds * 1e3 -
            (now - benchChampions.get(newTarget)!.lastTimeOnBench),
          0
        )

        this._log.info(`目标交换英雄: ${newTarget}`)
        this.state.setUpcomingGrab(newTarget, Date.now() + waitTime)
        this._notifyInChat('select', this.state.upcomingGrab!.championId, waitTime).catch(() => {})
        this._grabTimerId = setTimeout(() => this._trySwap(), waitTime)
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () => this._lc.data.gameflow.phase,
      (phase) => {
        if (phase !== 'ChampSelect' && this.state.upcomingGrab) {
          this.state.setUpcomingGrab(null)
          this._grabTimerId = null
        }
      }
    )
  }

  private async _notifyInChat(type: 'cancel' | 'select', championId: number, time = 0) {
    if (!this._lc.data.chat.conversations.championSelect) {
      return
    }

    try {
      await this._lc.api.chat.chatSend(
        this._lc.data.chat.conversations.championSelect.id,
        type === 'select'
          ? `[League Akari] - [自动选择]: 即将在 ${(time / 1000).toFixed(1)} 秒后选择 ${this._lc.data.gameData.champions[championId]?.name || championId}`
          : `[League Akari] - [自动选择]: 已取消选择 ${this._lc.data.gameData.champions[championId]?.name || championId}`,
        'celebration'
      )
    } catch (error) {
      this._ipc.sendEvent(AutoSelectMain.id, 'error-chat-send', formatError(error))
      this._log.warn(`无法发送信息`, error)
    }
  }

  private async _trySwap() {
    if (!this.state.upcomingGrab) {
      return
    }

    try {
      await this._lc.api.champSelect.benchSwap(this.state.upcomingGrab.championId)
      this._log.info(`已交换英雄: ${this.state.upcomingGrab.championId}`)
    } catch (error) {
      this._ipc.sendEvent(AutoSelectMain.id, 'error-bench-swap', this.state.upcomingGrab.championId)
      this._lc.api.playerNotifications
        .createTitleDetailsNotification(
          i18next.t('common.appName'),
          i18next.t('error-bench-swap', {
            champion:
              this._lc.data.gameData.champions[this.state.upcomingGrab.championId]?.name ||
              this.state.upcomingGrab.championId,
            reason: formatErrorMessage(error)
          })
        )
        .catch(() => {})
      this._log.warn(`在尝试交换英雄时发生错误`, error)
    } finally {
      this._grabTimerId = null
      this.state.setUpcomingGrab(null)
    }
  }
}
