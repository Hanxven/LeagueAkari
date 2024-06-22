import { action, benchSwap, pickOrBan } from '@main/http-api/champ-select'
import { chatSend } from '@main/http-api/chat'
import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { formatError } from '@shared/utils/errors'
import { comparer, computed } from 'mobx'

import { AppLogger, LogModule } from '../akari-core/log'
import { MainWindowModule } from '../akari-core/main-window'
import { LcuSyncModule } from '../lcu-state-sync'
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

    await this._loadSettings()
    this._setupStateSync()
    this._setupSettingsSync()
    this._setupMethodCall()
    this._handleAutoPickBan()
    this._handleBenchMode()

    this._logger.info('初始化完成')
  }

  private _handleAutoPickBan() {
    this.autoDisposeReaction(
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

    this.autoDisposeReaction(
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

    this.autoDisposeReaction(
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
            texts.push('普通模式自动选择')
          }

          if (this._lcu.champSelect.session.benchEnabled && this.state.settings.benchModeEnabled) {
            texts.push('随机模式自动选择')
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
              texts.push('自动禁用')
            }
          }

          if (texts.length) {
            chatSend(id, `[League Akari] ${texts.join('，')}已开启`, 'celebration').catch()
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

    this.autoDisposeReaction(
      () =>
        [
          simplifiedCsSession.get(),
          this.state.settings.benchExpectedChampions,
          this.state.settings.benchModeEnabled
        ] as const,
      ([s, e, o], [ps]) => {
        if (!s) {
          if (ps) {
            benchChampions.clear()
          }
          return
        }

        if (!s.benchEnabled) {
          return
        }

        const now = Date.now()
        // 对比变化并更新
        diffBenchAndUpdate(
          ps?.benchChampions.map((c) => c.championId) || [],
          s.benchChampions.map((c) => c.championId),
          now
        )

        if (!o) {
          if (this.state.upcomingGrab) {
            this._logger.info(`已取消即将进行的交换：ID：${this.state.upcomingGrab.championId}`)
            clearTimeout(this._grabTimerId!)
            this._grabTimerId = null
            this.state.setUpcomingGrab(null)
          }
          return
        }

        // 对于有目标的情况，如果目标还存在期望列表中且还在选择台中，那么直接返回
        // 如果不存在期望列表中了，那么找一个新的
        if (this.state.upcomingGrab) {
          if (
            e.includes(this.state.upcomingGrab.championId) &&
            benchChampions.has(this.state.upcomingGrab.championId)
          ) {
            return
          } else {
            this._logger.info(
              `取消了即将进行的英雄交换, 目标: ${this.state.upcomingGrab.championId}`
            )

            this._notifyInChat('cancel', this.state.upcomingGrab.championId)
            if (this.state.upcomingGrab) {
              clearTimeout(this._grabTimerId!)
              this._grabTimerId = null
              this.state.setUpcomingGrab(null)
            }
          }
        }

        // 如果手上已经有一个期望的了，那么直接返回
        const selfChampionId = s.myTeam.find((v) => v.cellId === s.localPlayerCellId)?.championId
        if (selfChampionId && e.includes(selfChampionId)) {
          return
        }

        // 寻找一个想要抢选的英雄，按照期望列表顺序遍历，排在前面的优先级更高
        for (const c of e) {
          // 很想要，但不能选，假装它不存在
          if (!this._lcu.champSelect.currentPickableChampions.has(c)) {
            continue
          }
          // 找到了一个用于目标
          if (benchChampions.has(c)) {
            // 单位：ms
            const waitTime = Math.max(
              this.state.settings.grabDelaySeconds * 1e3 -
                (now - benchChampions.get(c)!.lastTimeOnBench),
              0
            )

            this._logger.info(`目标交换英雄: ${c}`)

            this.state.setUpcomingGrab(c, Date.now() + waitTime)
            this._notifyInChat('select', this.state.upcomingGrab!.championId, waitTime)
            this._grabTimerId = setTimeout(() => this._trySwap(), waitTime)
            break
          }
        }
      },
      { equals: comparer.structural }
    )

    this.autoDisposeReaction(
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
    } catch (error) {
      this._logger.warn(`在尝试交换英雄时发生错误 ${formatError(error)}`)
      this._mwm.notify.warn('auto-select', '自动选择', `交换英雄失败`)
    } finally {
      this._grabTimerId = null
      this.state.setUpcomingGrab(null)
    }
  }

  private _setupSettingsSync() {
    this.simpleSync('settings/normal-mode-enabled', () => this.state.settings.normalModeEnabled)
    this.simpleSync('settings/only-simul-mode', () => this.state.settings.onlySimulMode)
    this.simpleSync('settings/expected-champions', () => this.state.settings.expectedChampions)
    this.simpleSync(
      'settings/select-teammate-intended-champion',
      () => this.state.settings.selectTeammateIntendedChampion
    )
    this.simpleSync('settings/show-intent', () => this.state.settings.showIntent)
    this.simpleSync('settings/completed', () => this.state.settings.completed)
    this.simpleSync('settings/bench-mode-enabled', () => this.state.settings.benchModeEnabled)
    this.simpleSync(
      'settings/bench-expected-champions',
      () => this.state.settings.benchExpectedChampions
    )
    this.simpleSync('settings/grab-delay-seconds', () => this.state.settings.grabDelaySeconds)
    this.simpleSync('settings/ban-enabled', () => this.state.settings.banEnabled)
    this.simpleSync('settings/banned-champions', () => this.state.settings.bannedChampions)
    this.simpleSync(
      'settings/ban-teammate-intended-champion',
      () => this.state.settings.banTeammateIntendedChampion
    )
  }

  private _setupMethodCall() {
    this.onCall('set-setting/normal-mode-enabled', async (enabled) => {
      this.state.settings.setNormalModeEnabled(enabled)
      await this._sm.settings.set('auto-select/normal-mode-enabled', enabled)
    })

    this.onCall('set-setting/only-simul-mode', async (enabled) => {
      this.state.settings.setOnlySimulMode(enabled)
      await this._sm.settings.set('auto-select/only-simul-mode', enabled)
    })

    this.onCall('set-setting/expected-champions', async (champions) => {
      this.state.settings.setExpectedChampions(champions)
      await this._sm.settings.set('auto-select/expected-champions', champions)
    })

    this.onCall('set-setting/select-teammate-intended-champion', async (enabled) => {
      this.state.settings.setSelectTeammateIntendedChampion(enabled)
      await this._sm.settings.set('auto-select/select-teammate-intended-champion', enabled)
    })

    this.onCall('set-setting/show-intent', async (enabled) => {
      this.state.settings.setShowIntent(enabled)
      await this._sm.settings.set('auto-select/show-intent', enabled)
    })

    this.onCall('set-setting/completed', async (enabled) => {
      this.state.settings.setCompleted(enabled)
      await this._sm.settings.set('auto-select/completed', enabled)
    })

    this.onCall('set-setting/bench-mode-enabled', async (enabled) => {
      this.state.settings.setBenchModeEnabled(enabled)
      await this._sm.settings.set('auto-select/bench-mode-enabled', enabled)
    })

    this.onCall('set-setting/bench-expected-champions', async (champions) => {
      this.state.settings.setBenchExpectedChampions(champions)
      await this._sm.settings.set('auto-select/bench-expected-champions', champions)
    })

    this.onCall('set-setting/grab-delay-seconds', async (seconds) => {
      this.state.settings.setGrabDelaySeconds(seconds)
      await this._sm.settings.set('auto-select/grab-delay-seconds', seconds)
    })

    this.onCall('set-setting/ban-enabled', async (enabled) => {
      this.state.settings.setBanEnabled(enabled)
      await this._sm.settings.set('auto-select/ban-enabled', enabled)
    })

    this.onCall('set-setting/banned-champions', async (champions) => {
      this.state.settings.setBannedChampions(champions)
      await this._sm.settings.set('auto-select/banned-champions', champions)
    })

    this.onCall('set-setting/ban-teammate-intended-champion', async (enabled) => {
      this.state.settings.setBanTeammateIntendedChampion(enabled)
      await this._sm.settings.set('auto-select/ban-teammate-intended-champion', enabled)
    })
  }

  private async _loadSettings() {
    this.state.settings.setNormalModeEnabled(
      await this._sm.settings.get(
        'auto-select/normal-mode-enabled',
        this.state.settings.normalModeEnabled
      )
    )

    this.state.settings.setOnlySimulMode(
      await this._sm.settings.get(
        'auto-select/only-simul-mode',
        this.state.settings.onlySimulMode
      )
    )

    this.state.settings.setExpectedChampions(
      await this._sm.settings.get(
        'auto-select/expected-champions',
        this.state.settings.expectedChampions
      )
    )

    this.state.settings.setSelectTeammateIntendedChampion(
      await this._sm.settings.get(
        'auto-select/select-teammate-intended-champion',
        this.state.settings.selectTeammateIntendedChampion
      )
    )

    this.state.settings.setShowIntent(
      await this._sm.settings.get(
        'auto-select/show-intent',
        this.state.settings.showIntent
      )
    )

    this.state.settings.setCompleted(
      await this._sm.settings.get('auto-select/completed', this.state.settings.completed)
    )

    this.state.settings.setBenchModeEnabled(
      await this._sm.settings.get(
        'auto-select/bench-mode-enabled',
        this.state.settings.benchModeEnabled
      )
    )

    this.state.settings.setBenchExpectedChampions(
      await this._sm.settings.get(
        'auto-select/bench-expected-champions',
        this.state.settings.benchExpectedChampions
      )
    )

    this.state.settings.setGrabDelaySeconds(
      await this._sm.settings.get(
        'auto-select/grab-delay-seconds',
        this.state.settings.grabDelaySeconds
      )
    )

    this.state.settings.setBanEnabled(
      await this._sm.settings.get(
        'auto-select/ban-enabled',
        this.state.settings.banEnabled
      )
    )

    this.state.settings.setBannedChampions(
      await this._sm.settings.get(
        'auto-select/banned-champions',
        this.state.settings.bannedChampions
      )
    )

    this.state.settings.setBanTeammateIntendedChampion(
      await this._sm.settings.get(
        'auto-select/ban-teammate-intended-champion',
        this.state.settings.banTeammateIntendedChampion
      )
    )
  }

  private async _setupStateSync() {
    this.simpleSync('champ-select-action-info', () => this.state.champSelectActionInfo)
    this.simpleSync('upcoming-pick', () => this.state.upcomingPick)
    this.simpleSync('upcoming-ban', () => this.state.upcomingBan)
    this.simpleSync('upcoming-grab', () => this.state.upcomingGrab)
  }
}

export const autoSelectModule = new AutoSelectModule()
