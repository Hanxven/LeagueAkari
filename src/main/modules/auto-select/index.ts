import { createLogger } from '@main/core-modules/log'
import { mwNotification } from '@main/core-modules/main-window'
import { action, benchSwap, pickOrBan } from '@main/http-api/champ-select'
import { chatSend } from '@main/http-api/chat'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { formatError } from '@shared/utils/errors'
import { comparer, computed, reaction } from 'mobx'

import { champSelect as cs } from '../lcu-state-sync/champ-select'
import { chat } from '../lcu-state-sync/chat'
import { gameData } from '../lcu-state-sync/game-data'
import { gameflow } from '../lcu-state-sync/gameflow'
import { autoSelectState } from './state'

const logger = createLogger('auto-select')

let grabTimerId: NodeJS.Timeout | null = null
let targetingChampion: number | null = null

export async function setupAutoSelect() {
  stateSync()
  ipcCall()
  await loadSettings()

  reaction(
    () => autoSelectState.upcomingPick,
    async (pick) => {
      if (!pick) {
        return
      }

      if (pick.isActingNow && pick.action.isInProgress) {
        if (
          !autoSelectState.settings.completed &&
          autoSelectState.champSelectActionInfo?.memberMe.championId === pick.championId
        ) {
          return
        }

        try {
          logger.info(
            `现在选择：${pick.championId}, ${autoSelectState.settings.completed}, actionId=${pick.action.id}`
          )

          await pickOrBan(
            pick.championId,
            autoSelectState.settings.completed,
            'pick',
            pick.action.id
          )
        } catch (error) {
          mwNotification.warn(
            'auto-select',
            '自动选择',
            `无法执行 action (选择英雄 ${pick.championId})`
          )
          logger.warn(
            `尝试自动执行 pick 时失败, 目标英雄: ${pick.championId} ${formatError(error)}`
          )
        }

        return
      }

      if (!pick.isActingNow) {
        if (!autoSelectState.settings.showIntent) {
          return
        }

        try {
          logger.info(`现在预选：${pick.championId}, actionId=${pick.action.id}`)

          await action(pick.action.id, { championId: pick.championId })
        } catch (error) {
          mwNotification.warn(
            'auto-select',
            '自动选择',
            `无法执行 action (预选英雄 ${pick.championId})`
          )
          logger.warn(`尝试自动执行预选时失败, 目标英雄: ${pick.championId} ${formatError(error)}`)
        }
        return
      }
    }
  )

  reaction(
    () => autoSelectState.upcomingBan,
    async (ban) => {
      if (!ban) {
        return
      }

      if (ban.action.isInProgress && ban.isActingNow) {
        try {
          await pickOrBan(ban.championId, true, 'ban', ban.action.id)
        } catch (error) {
          mwNotification.warn(
            'auto-select',
            '自动选择',
            `无法执行 action (禁用英雄 ${ban.championId})`
          )
          logger.warn(`尝试自动执行 pick 时失败, 目标英雄: ${ban.championId} ${formatError(error)}`)
        }
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
      logger.warn(`在尝试交换英雄时发生错误 ${formatError(error)}`)
    } finally {
      grabTimerId = null
      targetingChampion = null
    }
  }

  const simplifiedCsSession = computed(() => {
    if (!cs.session) {
      return null
    }

    const { benchEnabled, localPlayerCellId, benchChampions, myTeam } = cs.session

    return { benchEnabled, localPlayerCellId, benchChampions, myTeam }
  })

  reaction(
    () => [simplifiedCsSession.get(), autoSelectState.settings.benchExpectedChampions] as const,
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
          logger.info(`取消了即将进行的英雄交换, 目标: ${targetingChampion}`)

          notifyInChat('cancel', targetingChampion)
          if (grabTimerId) {
            clearTimeout(grabTimerId)
            grabTimerId = null
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

          logger.info(`目标交换英雄: ${c}`)

          targetingChampion = c
          notifyInChat('select', targetingChampion, waitTime)
          grabTimerId = setTimeout(trySwap, waitTime)
          break
        }
      }
    },
    { equals: comparer.structural }
  )

  logger.info('初始化完成')
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
  if (!enabled && grabTimerId) {
    logger.info(`已取消即将进行的交换：ID：${targetingChampion}`)
    notifyInChat('cancel', targetingChampion!)
    clearTimeout(grabTimerId)
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
  ipcStateSync(
    'auto-select/settings/ban-teammate-intended-champion',
    () => autoSelectState.settings.banTeammateIntendedChampion
  )

  ipcStateSync('auto-select/champ-select-action-info', () => autoSelectState.champSelectActionInfo)

  ipcStateSync('auto-select/upcoming-pick', () => autoSelectState.upcomingPick)

  ipcStateSync('auto-select/upcoming-ban', () => autoSelectState.upcomingBan)
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

  autoSelectState.settings.setBanTeammateIntendedChampion(
    await getSetting(
      'auto-select/ban-teammate-intended-champion',
      autoSelectState.settings.banTeammateIntendedChampion
    )
  )
}
