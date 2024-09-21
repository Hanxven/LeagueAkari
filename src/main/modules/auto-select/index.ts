import {
  MobxBasedBasicModule,
  RegisteredSettingHandler
} from '@main/akari-ipc/mobx-based-basic-module'
import { action, benchSwap, pickOrBan } from '@main/http-api/champ-select'
import { chatSend } from '@main/http-api/chat'
import { formatError } from '@shared/utils/errors'
import { Paths } from '@shared/utils/types'
import { set } from 'lodash'
import { comparer, computed, runInAction } from 'mobx'

import { LcuSyncModule } from '../lcu-state-sync'
import { AppLogger, LogModule } from '../log'
import { MainWindowModule } from '../main-window'
import { AutoSelectState } from './state'

export class AutoSelectModule extends MobxBasedBasicModule {
  public state = new AutoSelectState()

  private _grabTimerId: NodeJS.Timeout | null = null

  private _logger: AppLogger
  private _lcu: LcuSyncModule
  private _mwm: MainWindowModule

  constructor() {
    super('auto-select')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('auto-select')
    this._lcu = this.manager.getModule('lcu-state-sync')
    this._mwm = this.manager.getModule('main-window')

    await this._setupSettings()
    await this._setupStateSync()
    this._handleAutoPickBan()
    this._handleBenchMode()

    this._logger.info('初始化完成')
  }

  private _handleAutoPickBan() {
    this.reaction(
      () => this.state.upcomingPick,
      async (pick) => {
        if (!pick) {
          return
        }

        if (pick.isActingNow && pick.action.isInProgress) {
          if (
            !this.state.settings.completed &&
            this.state.champSelectActionInfo?.memberMe.championId === pick.championId
          ) {
            return
          }

          try {
            this._logger.info(
              `现在选择：${pick.championId}, ${this.state.settings.completed}, actionId=${pick.action.id}`
            )

            await pickOrBan(pick.championId, this.state.settings.completed, 'pick', pick.action.id)
          } catch (error) {
            this._mwm.notify.warn(
              'auto-select',
              '自动选择',
              `无法执行 action (选择英雄 ${pick.championId})`
            )
            this._logger.warn(
              `尝试自动执行 pick 时失败, 目标英雄: ${pick.championId} ${formatError(error)}`
            )
          }

          return
        }

        if (!pick.isActingNow) {
          if (!this.state.settings.showIntent) {
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
            this._logger.info(`现在预选：${pick.championId}, actionId=${pick.action.id}`)

            await action(pick.action.id, { championId: pick.championId })
          } catch (error) {
            this._mwm.notify.warn(
              'auto-select',
              '自动选择',
              `无法执行 action (预选英雄 ${pick.championId})`
            )
            this._logger.warn(
              `尝试自动执行预选时失败, 目标英雄: ${pick.championId} ${formatError(error)}`
            )
          }
          return
        }
      }
    )

    this.reaction(
      () => this.state.upcomingBan,
      async (ban) => {
        if (!ban) {
          return
        }

        if (ban.action.isInProgress && ban.isActingNow) {
          try {
            await pickOrBan(ban.championId, true, 'ban', ban.action.id)
          } catch (error) {
            this._mwm.notify.warn(
              'auto-select',
              '自动选择',
              `无法执行 action (禁用英雄 ${ban.championId})`
            )
            this._logger.warn(
              `尝试自动执行 pick 时失败, 目标英雄: ${ban.championId} ${formatError(error)}`
            )
          }
        }
      }
    )

    this.reaction(
      () => this.state.upcomingPick,
      (pick) => {
        this._logger.info(`Upcoming Pick - 即将进行的选择: ${JSON.stringify(pick)}`)
      }
    )

    this.reaction(
      () => this.state.upcomingBan,
      (ban) => {
        this._logger.info(`Upcoming Ban - 即将进行的禁用: ${JSON.stringify(ban)}`)
      }
    )

    this.reaction(
      () => this.state.upcomingGrab,
      (grab) => {
        this._logger.info(`Upcoming Grab - 即将进行的交换: ${JSON.stringify(grab)}`)
      }
    )

    // for logging only
    const positionInfo = computed(
      () => {
        if (!this.state.champSelectActionInfo) {
          return null
        }

        if (!this.state.settings.normalModeEnabled || !this.state.settings.banEnabled) {
          return null
        }

        const position = this.state.champSelectActionInfo.memberMe.assignedPosition

        const championsBan = this.state.settings.bannedChampions
        const championsPick = this.state.settings.expectedChampions

        return {
          position,
          ban: championsBan,
          pick: championsPick
        }
      },
      { equals: comparer.structural }
    )

    this.reaction(
      () => positionInfo.get(),
      (info) => {
        if (info) {
          this._logger.info(
            `当前分配到位置: ${info.position || '<空>'}, 预设选用英雄: ${JSON.stringify(info.pick)}, 预设禁用英雄: ${JSON.stringify(info.ban)}`
          )
        }
      }
    )

    this.reaction(
      () => this._lcu.chat.conversations.championSelect?.id,
      (id) => {
        if (id && this._lcu.gameflow.phase === 'ChampSelect') {
          if (!this._lcu.champSelect.session) {
            return
          }

          const texts: string[] = []
          if (
            !this._lcu.champSelect.session.benchEnabled &&
            this.state.settings.normalModeEnabled
          ) {
            texts.push('普通模式自动选择已开启')
          }

          if (this._lcu.champSelect.session.benchEnabled && this.state.settings.benchModeEnabled) {
            texts.push('随机模式自动选择已开启')
          }

          if (!this._lcu.champSelect.session.benchEnabled && this.state.settings.banEnabled) {
            let hasBanAction = false
            for (const arr of this._lcu.champSelect.session.actions) {
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
            chatSend(id, `[League Akari] ${texts.join(', ')}`, 'celebration').catch(() => {})
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
      if (!this._lcu.champSelect.session) {
        return null
      }

      const { benchEnabled, localPlayerCellId, benchChampions, myTeam } =
        this._lcu.champSelect.session

      return { benchEnabled, localPlayerCellId, benchChampions, myTeam }
    })

    this.reaction(
      () =>
        [
          simplifiedCsSession.get(),
          this.state.settings.benchExpectedChampions,
          this.state.settings.benchModeEnabled,
          this.state.settings.benchSelectFirstAvailableChampion
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
            this._logger.info(
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
            this._lcu.champSelect.currentPickableChampionIds.has(c) &&
            !this._lcu.champSelect.disabledChampionIds.has(c)
        )
        const pickableChampionsOnBench = availableExpectedChampions.filter((c) =>
          benchChampions.has(c)
        )

        // 本次变更, 如果有即将进行的交换, 则根据情况判断是否应该取消
        if (this.state.upcomingGrab) {
          if (pickableChampionsOnBench.length === 0) {
            this._logger.info(
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
              this._logger.info(
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
              this._logger.info(
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
          this.state.settings.grabDelaySeconds * 1e3 -
            (now - benchChampions.get(newTarget)!.lastTimeOnBench),
          0
        )

        this._logger.info(`目标交换英雄: ${newTarget}`)
        this.state.setUpcomingGrab(newTarget, Date.now() + waitTime)
        this._notifyInChat('select', this.state.upcomingGrab!.championId, waitTime).catch(() => {})
        this._grabTimerId = setTimeout(() => this._trySwap(), waitTime)
      },
      { equals: comparer.structural }
    )

    this.reaction(
      () => this._lcu.gameflow.phase,
      (phase) => {
        if (phase !== 'ChampSelect' && this.state.upcomingGrab) {
          this.state.setUpcomingGrab(null)
          this._grabTimerId = null
        }
      }
    )
  }

  private async _notifyInChat(type: 'cancel' | 'select', championId: number, time = 0) {
    if (!this._lcu.chat.conversations.championSelect) {
      return
    }

    try {
      await chatSend(
        this._lcu.chat.conversations.championSelect.id,
        type === 'select'
          ? `[League Akari] - [自动选择]: 即将在 ${(time / 1000).toFixed(1)} 秒后选择 ${this._lcu.gameData.champions[championId]?.name || championId}`
          : `[League Akari] - [自动选择]: 已取消选择 ${this._lcu.gameData.champions[championId]?.name || championId}`,
        'celebration'
      )
    } catch (error) {
      this._mwm.notify.warn('auto-select', '自动选择', `无法发送信息`)
      this._logger.warn(`无法发送信息 ${formatError(error)}`)
    }
  }

  private async _trySwap() {
    if (!this.state.upcomingGrab) {
      return
    }

    try {
      await benchSwap(this.state.upcomingGrab.championId)
      this._logger.info(`已交换英雄: ${this.state.upcomingGrab.championId}`)
    } catch (error) {
      this._logger.warn(`在尝试交换英雄时发生错误 ${formatError(error)}`)
      this._mwm.notify.warn('auto-select', '自动选择', `交换英雄失败`)
    } finally {
      this._grabTimerId = null
      this.state.setUpcomingGrab(null)
    }
  }

  private async _setupSettings() {
    this.registerSettings([
      {
        key: 'normalModeEnabled',
        defaultValue: this.state.settings.normalModeEnabled
      },
      {
        key: 'expectedChampions',
        defaultValue: this.state.settings.expectedChampions
      },
      {
        key: 'selectTeammateIntendedChampion',
        defaultValue: this.state.settings.selectTeammateIntendedChampion
      },
      {
        key: 'showIntent',
        defaultValue: this.state.settings.showIntent
      },
      {
        key: 'completed',
        defaultValue: this.state.settings.completed
      },
      {
        key: 'benchModeEnabled',
        defaultValue: this.state.settings.benchModeEnabled
      },
      {
        key: 'benchSelectFirstAvailableChampion',
        defaultValue: this.state.settings.benchSelectFirstAvailableChampion
      },
      {
        key: 'benchExpectedChampions',
        defaultValue: this.state.settings.benchExpectedChampions
      },
      {
        key: 'grabDelaySeconds',
        defaultValue: this.state.settings.grabDelaySeconds
      },
      {
        key: 'banEnabled',
        defaultValue: this.state.settings.banEnabled
      },
      {
        key: 'bannedChampions',
        defaultValue: this.state.settings.bannedChampions
      },
      {
        key: 'banTeammateIntendedChampion',
        defaultValue: this.state.settings.banTeammateIntendedChampion
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

    this.onSettingChange<Paths<typeof this.state.settings>>('normalModeEnabled', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('expectedChampions', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>(
      'selectTeammateIntendedChampion',
      defaultSetter
    )
    this.onSettingChange<Paths<typeof this.state.settings>>('showIntent', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('completed', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('benchModeEnabled', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>(
      'benchSelectFirstAvailableChampion',
      defaultSetter
    )
    this.onSettingChange<Paths<typeof this.state.settings>>('benchExpectedChampions', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('grabDelaySeconds', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('banEnabled', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('bannedChampions', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>(
      'banTeammateIntendedChampion',
      defaultSetter
    )
  }

  private async _setupStateSync() {
    this.propSync('state', this.state, [
      'upcomingBan',
      'upcomingPick',
      'upcomingGrab',
      'memberMe',
      'settings.banEnabled',
      'settings.benchModeEnabled',
      'settings.benchSelectFirstAvailableChampion',
      'settings.completed',
      'settings.grabDelaySeconds',
      'settings.normalModeEnabled',
      'settings.selectTeammateIntendedChampion',
      'settings.showIntent',
      'settings.banTeammateIntendedChampion'
    ])
    this.propSync(
      'state',
      this.state,
      ['settings.expectedChampions', 'settings.benchExpectedChampions', 'settings.bannedChampions'],
      true
    )
  }
}

export const autoSelectModule = new AutoSelectModule()
