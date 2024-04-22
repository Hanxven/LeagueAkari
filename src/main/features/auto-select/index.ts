import { lcuEventBus } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { mwNotification } from '@main/core/main-window'
import { action, benchSwap, pickOrBan } from '@main/http-api/champ-select'
import { chatSend } from '@main/http-api/chat'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { Action, ChampSelectSummoner } from '@shared/types/lcu/champ-select'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'
import { comparer, computed, observable, reaction, runInAction } from 'mobx'

import { champSelect as cs } from '../lcu-state-sync/champ-select'
import { chat } from '../lcu-state-sync/chat'
import { gameData } from '../lcu-state-sync/game-data'
import { gameflow } from '../lcu-state-sync/gameflow'
import { summoner } from '../lcu-state-sync/summoner'
import { autoSelectState } from './state'

const logger = createLogger('auto-select')

let grabTimer: NodeJS.Timeout | null = null
let targetingChampion: number | null = null

function getRandomValue() {
  return Math.floor(Math.random() * 1.14514e12)
}

export async function setupAutoSelect() {
  stateSync()
  ipcCall()
  await loadSettings()

  let randomlyPickSeed = 1.14e12
  let randomlyBanSeed = 5.14e11
  reaction(
    () => gameflow.phase,
    (phase) => {
      if (phase === 'ChampSelect') {
        randomlyPickSeed = getRandomValue()
        randomlyBanSeed = getRandomValue()
      }
    }
  )

  const currentPickActionChampion = computed(() => {
    if (!cs.session || !autoSelectState.settings.expectedChampions || !summoner.me) {
      return null
    }

    if (!autoSelectState.settings.normalModeEnabled) {
      return null
    }

    if (!cs.session.hasSimultaneousPicks && autoSelectState.settings.onlySimulMode) {
      return null
    }

    let hasPickAction = false
    for (const arr of cs.session.actions) {
      if (arr.findIndex((a) => a.type === 'pick') !== -1) {
        hasPickAction = true
        break
      }
    }

    if (!hasPickAction) {
      return null
    }

    const self = cs.session.myTeam.find((t) => t.summonerId === summoner.me?.summonerId)

    if (!self) {
      return null
    }

    const unselectableChampions = [...cs.session.myTeam, ...cs.session.theirTeam].reduce(
      (prev, cur) => {
        if (cur.championId && cur.summonerId !== summoner.me!.summonerId) {
          prev.add(cur.championId)
        }
        return prev
      },
      new Set<number>()
    )

    cs.session.actions.forEach((ar) =>
      ar.forEach((a) => {
        if (a.type === 'ban' && a.completed) {
          unselectableChampions.add(a.championId)
        }
      })
    )

    if (!autoSelectState.settings.selectTeammateIntendedChampion) {
      cs.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.summonerId !== summoner.me!.summonerId) {
          unselectableChampions.add(m.championPickIntent)
        }
      })
    }

    ;[...cs.session.bans.myTeamBans, ...cs.session.bans.theirTeamBans].forEach((c) =>
      unselectableChampions.add(c)
    )

    const expected = [...autoSelectState.settings.expectedChampions]

    const pickableChampions = expected.filter(
      (c) => !unselectableChampions.has(c) && cs.currentPickableChampions.has(c)
    )

    if (pickableChampions.length === 0) {
      return null
    }

    const candidate =
      autoSelectState.settings.selectRandomly && !self!.championPickIntent
        ? pickableChampions[randomlyPickSeed % pickableChampions.length]
        : pickableChampions[0]

    // 已经选择的英雄将不再触发操作
    if (!autoSelectState.settings.completed && self!.championId === candidate) {
      return null
    }

    return candidate
  })

  reaction(
    () => currentPickActionChampion.get(),
    async (id) => {
      if (!autoSelectState.settings.showIntent) {
        return
      }

      if (id && cs.session && summoner.me) {
        const cellId = cs.session.myTeam.find(
          (c) => c.summonerId === summoner.me!.summonerId
        )!.cellId

        for (const arr of cs.session.actions) {
          const a = arr.find((c) => c.actorCellId === cellId && c.type === 'pick')

          if (a) {
            if (!a.isInProgress && !a.completed) {
              try {
                logger.info('Trying to show champion picking intent')

                await action(a.id, { championId: id })
              } catch (error) {
                mwNotification.warn('auto-select', '自动选择', `无法执行 action (预选英雄 ${id})`)
                logger.warn(`Something wrong when doing action ${formatError(error)}`)
              }
            }
            break
          }
        }
      }
    }
  )

  const activeSummonerState = observable.box<{
    actionType: string
    actions: Pick<Action, 'id' | 'type'>[]
    cellId: number
  } | null>(null, { equals: comparer.structural })

  reaction(
    () => gameflow.phase,
    (phase) => {
      if (phase !== 'ChampSelect') {
        runInAction(() => activeSummonerState.set(null))
      }
    }
  )

  reaction(
    () => chat.conversations.championSelect?.id,
    (id) => {
      if (id && gameflow.phase === 'ChampSelect') {
        if (!cs.session) {
          return
        }

        const texts: string[] = []
        if (!cs.session.benchEnabled && autoSelectState.settings.normalModeEnabled) {
          texts.push('普通模式自动选择')
        }

        if (cs.session.benchEnabled && autoSelectState.settings.benchModeEnabled) {
          texts.push('随机模式自动选择')
        }

        if (!cs.session.benchEnabled && autoSelectState.settings.banEnabled) {
          let hasBanAction = false
          for (const arr of cs.session.actions) {
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

  lcuEventBus.on<LcuEvent<ChampSelectSummoner>>(
    '/lol-champ-select/v1/summoners/*',
    async (event) => {
      if (event.eventType === 'Delete') {
        runInAction(() => activeSummonerState.set(null))
        return
      }

      if (!event.data.isSelf || !event.data.isActingNow) {
        return
      }

      if (!cs.session) {
        return
      }

      const myInProgressActions = cs.session.actions.reduce((p, c) => {
        const action = c.find((a) => a.actorCellId === event.data.cellId)
        if (action && action.isInProgress) {
          p.push(action)
        }
        return p
      }, [] as Action[])

      runInAction(() => {
        activeSummonerState.set({
          actionType: event.data.activeActionType,
          cellId: event.data.cellId,
          actions: myInProgressActions.map((a) => ({
            id: a.id,
            type: a.type
          }))
        })
      })
    }
  )

  reaction(
    () => activeSummonerState.get(),
    async (s) => {
      if (!s) {
        return
      }

      logger.info(`Now active action: ${s.actionType} ${JSON.stringify(s.actions)} ${s.cellId}`)

      if (!summoner.me) {
        logger.warn('Summoner information is not loaded')
        return
      }

      if (s.actionType === 'pick') {
        if (!currentPickActionChampion.get()) {
          if (chat.conversations.championSelect && autoSelectState.settings.normalModeEnabled) {
            logger.info('No pickable champion now')

            chatSend(
              chat.conversations.championSelect.id,
              '[League Akari] 无可用英雄供自动选择',
              'celebration'
            ).catch()
          }
          return
        }

        const firstPickAction = s.actions.find((a) => a.type === 'pick')

        if (!firstPickAction) {
          logger.info('No pick action now')
          return
        }

        try {
          await pickOrBan(
            currentPickActionChampion.get()!,
            autoSelectState.settings.completed,
            'pick',
            firstPickAction.id
          )
        } catch (error) {
          mwNotification.warn(
            'auto-select',
            '自动选择',
            `无法执行 action (选择英雄 ${currentPickActionChampion.get()})`
          )
          logger.warn(
            `Failed to do 'pick' a=${firstPickAction.id} c=${currentPickActionChampion.get()}`
          )
        }
      } else if (s.actionType === 'ban') {
        if (!autoSelectState.settings.banEnabled) {
          return
        }

        if (!cs.session) {
          logger.warn('No champ select session loaded')

          return
        }

        logger.info(`Now active action: ${s.actionType} ${JSON.stringify(s.actions)} ${s.cellId}`)

        const firstBanAction = s.actions.find((a) => a.type === 'ban')

        if (!firstBanAction) {
          return
        }

        const unbannableChampions = [
          ...cs.session.bans.myTeamBans,
          ...cs.session.bans.theirTeamBans
        ].reduce((prev, cur) => {
          if (cur) {
            prev.add(cur)
          }
          return prev
        }, new Set<number>())

        cs.session.actions.forEach((ar) =>
          ar.forEach((a) => {
            if (a.type === 'ban' && a.completed) {
              unbannableChampions.add(a.championId)
            }
          })
        )

        if (!autoSelectState.settings.banTeammateIntendedChampion) {
          cs.session.myTeam.forEach((m) => {
            if (m.championPickIntent && m.summonerId !== summoner.me!.summonerId) {
              unbannableChampions.add(m.championPickIntent)
            }
          })
        }

        const bannableChampions = autoSelectState.settings.bannedChampions.filter(
          (c) => !unbannableChampions.has(c) && cs.currentBannableChampions.has(c)
        )

        if (bannableChampions.length === 0) {
          logger.info('No bannable champion now')

          if (chat.conversations.championSelect) {
            chatSend(
              chat.conversations.championSelect.id,
              '[League Akari] 无可用英雄供自动禁用',
              'celebration'
            ).catch()
          }
          return
        }

        const candidate = autoSelectState.settings.banRandomly
          ? bannableChampions[randomlyBanSeed % bannableChampions.length]
          : bannableChampions[0]

        try {
          await pickOrBan(candidate, true, 'ban', firstBanAction.id)
        } catch (error) {
          mwNotification.warn('auto-select', '自动选择', `无法执行 action (禁用英雄 ${candidate})`)
          logger.warn(`Failed to do 'ban' a=${firstBanAction.id} c=${candidate}`)
        }
      }
    }
  )

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

  const trySwap = async () => {
    try {
      await benchSwap(targetingChampion!)
    } catch (error) {
      mwNotification.warn('auto-select', '自动选择', `交换英雄失败`)
      logger.warn('Something wrong on swapping champion')
    } finally {
      targetingChampion = null
    }
  }

  reaction(
    () => [cs.session, autoSelectState.settings.benchExpectedChampions] as const,
    ([s, e], [ps]) => {
      if (!s) {
        if (ps) {
          benchChampions.clear()
        }
        return
      }

      if (!s.benchEnabled || !autoSelectState.settings.benchModeEnabled) {
        return
      }

      const now = Date.now()
      // 对比变化并更新
      diffBenchAndUpdate(
        ps?.benchChampions.map((c) => c.championId) || [],
        s.benchChampions.map((c) => c.championId),
        now
      )

      // 对于有目标的情况，如果目标还存在期望列表中且还在选择台中，那么直接返回
      // 如果不存在期望列表中了，那么找一个新的
      if (targetingChampion) {
        if (e.includes(targetingChampion) && benchChampions.has(targetingChampion)) {
          return
        } else {
          logger.info(`Canceling swap champion ${targetingChampion}`)

          notifyInChat('cancel', targetingChampion)
          if (grabTimer) {
            clearTimeout(grabTimer)
            grabTimer = null
          }
          targetingChampion = null
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
        if (!cs.currentPickableChampions.has(c)) {
          continue
        }
        // 找到了一个用于目标
        if (benchChampions.has(c)) {
          // 单位：ms
          const waitTime = Math.max(
            autoSelectState.settings.grabDelaySeconds * 1e3 -
              (now - benchChampions.get(c)!.lastTimeOnBench),
            0
          )

          logger.info(`Targeting champion ${c}`)

          targetingChampion = c
          notifyInChat('select', targetingChampion, waitTime)
          grabTimer = setTimeout(trySwap, waitTime)
          break
        }
      }
    }
  )

  logger.info('Initialized')
}

async function notifyInChat(type: 'cancel' | 'select', championId: number, time = 0) {
  if (!chat.conversations.championSelect) {
    return
  }

  try {
    await chatSend(
      chat.conversations.championSelect.id,
      type === 'select'
        ? `[League Akari] - [自动选择]: 即将在 ${(time / 1000).toFixed(1)} 秒后选择 ${gameData.champions[championId]?.name || championId}`
        : `[League Akari] - [自动选择]: 已取消选择 ${gameData.champions[championId]?.name || championId}`,
      'celebration'
    )
  } catch (error) {
    mwNotification.warn('auto-select', '自动选择', `无法发送信息`)
    logger.warn(`无法发送信息 ${formatError(error)}`)
  }
}

export async function setBenchModeEnabled(enabled: boolean) {
  if (!enabled && grabTimer) {
    logger.info(`已取消即将进行的交换：ID：${targetingChampion}`)
    notifyInChat('cancel', targetingChampion!)
    clearTimeout(grabTimer)
    targetingChampion = null
  }

  autoSelectState.settings.benchModeEnabled = enabled
  await setSetting('auto-select/bench-mode-enabled', enabled)
}

function stateSync() {
  ipcStateSync(
    'auto-select/settings/normal-mode-enabled',
    () => autoSelectState.settings.normalModeEnabled
  )
  ipcStateSync('auto-select/settings/only-simul-mode', () => autoSelectState.settings.onlySimulMode)
  ipcStateSync(
    'auto-select/settings/expected-champions',
    () => autoSelectState.settings.expectedChampions
  )
  ipcStateSync(
    'auto-select/settings/select-teammate-intended-champion',
    () => autoSelectState.settings.selectTeammateIntendedChampion
  )
  ipcStateSync(
    'auto-select/settings/select-randomly',
    () => autoSelectState.settings.selectRandomly
  )
  ipcStateSync('auto-select/settings/show-intent', () => autoSelectState.settings.showIntent)
  ipcStateSync('auto-select/settings/completed', () => autoSelectState.settings.completed)
  ipcStateSync(
    'auto-select/settings/bench-mode-enabled',
    () => autoSelectState.settings.benchModeEnabled
  )
  ipcStateSync(
    'auto-select/settings/bench-expected-champions',
    () => autoSelectState.settings.benchExpectedChampions
  )
  ipcStateSync(
    'auto-select/settings/grab-delay-seconds',
    () => autoSelectState.settings.grabDelaySeconds
  )
  ipcStateSync('auto-select/settings/ban-enabled', () => autoSelectState.settings.banEnabled)
  ipcStateSync(
    'auto-select/settings/banned-champions',
    () => autoSelectState.settings.bannedChampions
  )
  ipcStateSync('auto-select/settings/ban-randomly', () => autoSelectState.settings.banRandomly)
  ipcStateSync(
    'auto-select/settings/ban-teammate-intended-champion',
    () => autoSelectState.settings.banTeammateIntendedChampion
  )
}

function ipcCall() {
  onRendererCall('auto-select/settings/normal-mode-enabled/set', async (_, enabled) => {
    autoSelectState.settings.setNormalModeEnabled(enabled)
    await setSetting('auto-select/normal-mode-enabled', enabled)
  })

  onRendererCall('auto-select/settings/only-simul-mode/set', async (_, enabled) => {
    autoSelectState.settings.setOnlySimulMode(enabled)
    await setSetting('auto-select/only-simul-mode', enabled)
  })

  onRendererCall('auto-select/settings/expected-champions/set', async (_, champions) => {
    autoSelectState.settings.setExpectedChampions(champions)
    await setSetting('auto-select/expected-champions', champions)
  })

  onRendererCall(
    'auto-select/settings/select-teammate-intended-champion/set',
    async (_, enabled) => {
      autoSelectState.settings.setSelectTeammateIntendedChampion(enabled)
      await setSetting('auto-select/select-teammate-intended-champion', enabled)
    }
  )

  onRendererCall('auto-select/settings/select-randomly/set', async (_, enabled) => {
    autoSelectState.settings.setSelectRandomly(enabled)
    await setSetting('auto-select/select-randomly', enabled)
  })

  onRendererCall('auto-select/settings/show-intent/set', async (_, enabled) => {
    autoSelectState.settings.setShowIntent(enabled)
    await setSetting('auto-select/show-intent', enabled)
  })

  onRendererCall('auto-select/settings/completed/set', async (_, enabled) => {
    autoSelectState.settings.setCompleted(enabled)
    await setSetting('auto-select/completed', enabled)
  })

  onRendererCall('auto-select/settings/bench-mode-enabled/set', async (_, enabled) => {
    autoSelectState.settings.setBenchModeEnabled(enabled)
    await setSetting('auto-select/bench-mode-enabled', enabled)
  })

  onRendererCall('auto-select/settings/bench-expected-champions/set', async (_, champions) => {
    autoSelectState.settings.setBenchExpectedChampions(champions)
    await setSetting('auto-select/bench-expected-champions', champions)
  })

  onRendererCall('auto-select/settings/grab-delay-seconds/set', async (_, seconds) => {
    autoSelectState.settings.setGrabDelaySeconds(seconds)
    await setSetting('auto-select/grab-delay-seconds', seconds)
  })

  onRendererCall('auto-select/settings/ban-enabled/set', async (_, enabled) => {
    autoSelectState.settings.setBanEnabled(enabled)
    await setSetting('auto-select/ban-enabled', enabled)
  })

  onRendererCall('auto-select/settings/banned-champions/set', async (_, champions) => {
    autoSelectState.settings.setBannedChampions(champions)
    await setSetting('auto-select/banned-champions', champions)
  })

  onRendererCall('auto-select/settings/ban-randomly/set', async (_, enabled) => {
    autoSelectState.settings.setBanRandomly(enabled)
    await setSetting('auto-select/ban-randomly', enabled)
  })

  onRendererCall('auto-select/settings/ban-teammate-intended-champion/set', async (_, enabled) => {
    autoSelectState.settings.setBanTeammateIntendedChampion(enabled)
    await setSetting('auto-select/ban-teammate-intended-champion', enabled)
  })
}

async function loadSettings() {
  autoSelectState.settings.setNormalModeEnabled(
    await getSetting('auto-select/normal-mode-enabled', autoSelectState.settings.normalModeEnabled)
  )

  autoSelectState.settings.setOnlySimulMode(
    await getSetting('auto-select/only-simul-mode', autoSelectState.settings.onlySimulMode)
  )

  autoSelectState.settings.setExpectedChampions(
    await getSetting('auto-select/expected-champions', autoSelectState.settings.expectedChampions)
  )

  autoSelectState.settings.setSelectTeammateIntendedChampion(
    await getSetting(
      'auto-select/select-teammate-intended-champion',
      autoSelectState.settings.selectTeammateIntendedChampion
    )
  )

  autoSelectState.settings.setSelectRandomly(
    await getSetting('auto-select/select-randomly', autoSelectState.settings.selectRandomly)
  )

  autoSelectState.settings.setShowIntent(
    await getSetting('auto-select/show-intent', autoSelectState.settings.showIntent)
  )

  autoSelectState.settings.setCompleted(
    await getSetting('auto-select/completed', autoSelectState.settings.completed)
  )

  autoSelectState.settings.setBenchModeEnabled(
    await getSetting('auto-select/bench-mode-enabled', autoSelectState.settings.benchModeEnabled)
  )

  autoSelectState.settings.setBenchExpectedChampions(
    await getSetting(
      'auto-select/bench-expected-champions',
      autoSelectState.settings.benchExpectedChampions
    )
  )

  autoSelectState.settings.setGrabDelaySeconds(
    await getSetting('auto-select/grab-delay-seconds', autoSelectState.settings.grabDelaySeconds)
  )

  autoSelectState.settings.setBanEnabled(
    await getSetting('auto-select/ban-enabled', autoSelectState.settings.banEnabled)
  )

  autoSelectState.settings.setBannedChampions(
    await getSetting('auto-select/banned-champions', autoSelectState.settings.bannedChampions)
  )

  autoSelectState.settings.setBanRandomly(
    await getSetting('auto-select/ban-randomly', autoSelectState.settings.banRandomly)
  )

  autoSelectState.settings.setBanTeammateIntendedChampion(
    await getSetting(
      'auto-select/ban-teammate-intended-champion',
      autoSelectState.settings.banTeammateIntendedChampion
    )
  )
}
