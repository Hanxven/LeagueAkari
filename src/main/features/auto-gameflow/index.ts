import { lcuEventBus } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { mwNotification } from '@main/core/main-window'
import { chatSend } from '@main/http-api/chat'
import { honor } from '@main/http-api/honor-v2'
import { getEogStatus, playAgain, searchMatch } from '@main/http-api/lobby'
import { accept } from '@main/http-api/matchmaking'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { LcuEvent } from '@shared/types/lcu/event'
import { Ballot } from '@shared/types/lcu/honorV2'
import { formatError } from '@shared/utils/errors'
import { comparer, reaction } from 'mobx'

import { chat } from '../lcu-state-sync/chat'
import { gameflow } from '../lcu-state-sync/gameflow'
import { summoner } from '../lcu-state-sync/summoner'
import { autoGameflowState } from './state'

const HONOR_CATEGORY = ['COOL', 'SHOTCALLER', 'HEART'] as const

const logger = createLogger('auto-gameflow')

let autoAcceptTimerId: NodeJS.Timeout | null = null
let autoSearchMatchTimerId: NodeJS.Timeout | null = null
let autoSearchMatchCountdownTimerId: NodeJS.Timeout | null = null

export async function setupAutoGameflow() {
  stateSync()
  ipcCall()
  await loadSettings()

  // 结算点赞
  lcuEventBus.on<LcuEvent<Ballot>>('/lol-honor-v2/v1/ballot', async (message) => {
    if (message.eventType === 'Create' && autoGameflowState.settings.autoHonorEnabled) {
      try {
        if (autoGameflowState.settings.autoHonorStrategy === 'opt-out') {
          await honor(message.data.gameId, 'OPT_OUT', 0)
          return
        }

        const eligiblePlayers = message.data.eligiblePlayers
        const honorablePlayerIds: number[] = []

        if (autoGameflowState.settings.autoHonorStrategy === 'all-member') {
          honorablePlayerIds.push(...eligiblePlayers.map((p) => p.summonerId))
        } else {
          const eligiblePlayerIds = new Set(eligiblePlayers.map((p) => p.summonerId))
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
          ).filter((p) => p.summonerId !== summoner.me?.summonerId)

          const honorableLobbyMembers = lobbyMemberSummoners.filter((p) =>
            eligiblePlayerIds.has(p.summonerId)
          )

          if (autoGameflowState.settings.autoHonorStrategy === 'only-lobby-member') {
            honorablePlayerIds.push(...honorableLobbyMembers.map((p) => p.summonerId))
          } else if (autoGameflowState.settings.autoHonorStrategy === 'prefer-lobby-member') {
            if (honorableLobbyMembers.length === 0) {
              honorablePlayerIds.push(...eligiblePlayers.map((p) => p.summonerId))
            } else {
              honorablePlayerIds.push(...honorableLobbyMembers.map((p) => p.summonerId))
            }
          }
        }

        if (honorablePlayerIds.length) {
          const category = HONOR_CATEGORY[Math.floor(Math.random() * HONOR_CATEGORY.length)]
          const candidate =
            honorablePlayerIds[Math.floor(Math.random() * honorablePlayerIds.length)]
          await honor(message.data.gameId, category, candidate)

          logger.info(`给玩家: ${candidate} 点赞, for ${category}, game ID: ${message.data.gameId}`)
        } else {
          await honor(message.data.gameId, 'OPT_OUT', 0)
          logger.info('跳过点赞阶段')
        }
      } catch (error) {
        mwNotification.warn('auto-gameflow', '自动点赞', '尝试自动点赞出现问题')
        logger.warn(`无法给玩家点赞 ${formatError(error)}`)
      }
    }
  })

  // 自动回到房间
  reaction(
    () => [gameflow.phase, autoGameflowState.settings.playAgainEnabled] as const,
    async ([phase, enabled]) => {
      if (enabled && phase === 'EndOfGame') {
        try {
          await playAgain()
          logger.info('Play again, 返回房间')
        } catch (error) {
          logger.warn(`尝试 Play again 时失败 ${formatError(error)}`)
        }
      }
    },
    { equals: comparer.shallow }
  )

  // 自动接受
  reaction(
    () => gameflow.phase,
    (phase) => {
      if (!autoGameflowState.settings.autoAcceptEnabled) {
        return
      }

      if (phase === 'ReadyCheck') {
        autoGameflowState.setAcceptAt(
          Date.now() + autoGameflowState.settings.autoAcceptDelaySeconds * 1e3
        )
        autoAcceptTimerId = setTimeout(
          acceptMatch,
          autoGameflowState.settings.autoAcceptDelaySeconds * 1e3
        )

        logger.info(
          `ReadyCheck! 即将在 ${autoGameflowState.settings.autoAcceptDelaySeconds} 秒后接受对局`
        )
      } else {
        if (autoAcceptTimerId) {
          if (autoGameflowState.willAccept) {
            logger.info(`取消了即将进行的接受操作 - 不在游戏 ReadyCheck 过程中`)
          }

          clearTimeout(autoAcceptTimerId)
          autoAcceptTimerId = null
        }
        autoGameflowState.clearAutoAccept()
      }
    }
  )

  // 在设置项变更时解除即将进行的自动接受
  reaction(
    () => autoGameflowState.settings.autoAcceptEnabled,
    (enabled) => {
      if (!enabled) {
        cancelAutoAccept()
      }
    }
  )

  // 如果玩家手动取消了本次接受，则尝试取消即将进行的自动接受（如果有）
  lcuEventBus.on('/lol-matchmaking/v1/ready-check', (event) => {
    if (event.data && event.data.playerResponse === 'Declined') {
      cancelAutoAccept(true)
    }
  })

  // 在设置项变更时解除即将进行的自动匹配
  reaction(
    () => autoGameflowState.settings.autoSearchMatchEnabled,
    (enabled) => {
      if (!enabled) {
        cancelAutoSearchMatch('normal')
      }
    }
  )

  // 自动开始匹配
  reaction(
    () =>
      [
        autoGameflowState.activityStartStatus,
        autoGameflowState.settings.autoSearchMatchEnabled
      ] as const,
    ([s, enabled]) => {
      if (!enabled) {
        cancelAutoSearchMatch('normal')
        return
      }

      if (s === 'can-start-activity') {
        logger.info(
          `现在将在 ${autoGameflowState.settings.autoSearchMatchDelaySeconds} 秒后开始匹配`
        )
        autoGameflowState.setSearchMatchAt(
          Date.now() + autoGameflowState.settings.autoSearchMatchDelaySeconds * 1e3
        )
        autoSearchMatchTimerId = setTimeout(
          startMatchmaking,
          autoGameflowState.settings.autoSearchMatchDelaySeconds * 1e3
        )

        printAutoSearchMatchInfo()
        autoSearchMatchCountdownTimerId = setInterval(printAutoSearchMatchInfo, 1000)
      } else if (s === 'unavailable' || s === 'cannot-start-activity') {
        cancelAutoSearchMatch('normal')
      } else if (s === 'waiting-for-invitees') {
        cancelAutoSearchMatch('waiting-for-invitee')
      } else if (s === 'not-the-leader') {
        cancelAutoSearchMatch('waiting-for-invitee')
      }
    },
    { equals: comparer.shallow }
  )

  logger.info('初始化完成')
}

function stateSync() {
  ipcStateSync(
    'auto-gameflow/settings/auto-honor-enabled',
    () => autoGameflowState.settings.autoHonorEnabled
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-honor-strategy',
    () => autoGameflowState.settings.autoHonorStrategy
  )

  ipcStateSync(
    'auto-gameflow/settings/play-again-enabled',
    () => autoGameflowState.settings.playAgainEnabled
  )

  ipcStateSync('auto-gameflow/will-accept', () => autoGameflowState.willAccept)

  ipcStateSync('auto-gameflow/will-accept-at', () => autoGameflowState.willAcceptAt)

  ipcStateSync(
    'auto-gameflow/settings/auto-accept-enabled',
    () => autoGameflowState.settings.autoAcceptEnabled
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-accept-delay-seconds',
    () => autoGameflowState.settings.autoAcceptDelaySeconds
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-search-match-enabled',
    () => autoGameflowState.settings.autoSearchMatchEnabled
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-search-match-delay-seconds',
    () => autoGameflowState.settings.autoSearchMatchDelaySeconds
  )

  ipcStateSync('auto-gameflow/will-search-match', () => autoGameflowState.willSearchMatch)

  ipcStateSync('auto-gameflow/will-search-match-at', () => autoGameflowState.willSearchMatchAt)

  ipcStateSync('auto-gameflow/activity-start-status', () => autoGameflowState.activityStartStatus)
}

function ipcCall() {
  onRendererCall('auto-gameflow/settings/auto-honor-enabled/set', async (_, enabled) => {
    autoGameflowState.settings.setAutoHonorEnabled(enabled)
    await setSetting('auto-gameflow/auto-honor-enabled', enabled)
  })

  onRendererCall('auto-gameflow/settings/auto-honor-strategy/set', async (_, strategy) => {
    autoGameflowState.settings.setAutoHonorStrategy(strategy)
    await setSetting('auto-gameflow/auto-honor-strategy', strategy)
  })

  onRendererCall('auto-gameflow/settings/play-again-enabled/set', async (_, enabled) => {
    autoGameflowState.settings.setPlayAgainEnabled(enabled)
    await setSetting('auto-gameflow/play-again-enabled', enabled)
  })

  onRendererCall('auto-gameflow/cancel-auto-accept', async (_) => {
    cancelAutoAccept()
  })

  onRendererCall('auto-gameflow/settings/auto-accept-enabled/set', async (_, enabled) => {
    if (!enabled) {
      cancelAutoAccept()
    }

    autoGameflowState.settings.setAutoAcceptEnabled(enabled)
    await setSetting('auto-gameflow/auto-accept-enabled', enabled)
  })

  onRendererCall(
    'auto-gameflow/settings/auto-accept-delay-seconds/set',
    async (_, delaySeconds) => {
      autoGameflowState.settings.setAutoAcceptDelaySeconds(delaySeconds)
      await setSetting('auto-gameflow/auto-accept-delay-seconds', delaySeconds)
    }
  )

  onRendererCall('auto-gameflow/cancel-auto-search-match', () => {
    cancelAutoSearchMatch('normal')
  })

  onRendererCall(
    'auto-gameflow/settings/auto-search-match-enabled/set',
    async (_, enabled: boolean) => {
      autoGameflowState.settings.setAutoSearchMatchEnabled(enabled)
      await setSetting('auto-gameflow/auto-search-match-enabled', enabled)
    }
  )

  onRendererCall(
    'auto-gameflow/settings/auto-search-match-delay-seconds/set',
    async (_, seconds: number) => {
      autoGameflowState.settings.setAutoSearchMatchDelaySeconds(seconds)
      await setSetting('auto-gameflow/auto-search-match-delay-seconds', seconds)
    }
  )
}

async function loadSettings() {
  autoGameflowState.settings.setAutoHonorEnabled(
    await getSetting(
      'auto-gameflow/auto-honor-enabled',
      autoGameflowState.settings.autoHonorEnabled
    )
  )

  autoGameflowState.settings.setAutoHonorStrategy(
    await getSetting(
      'auto-gameflow/auto-honor-strategy',
      autoGameflowState.settings.autoHonorStrategy
    )
  )

  autoGameflowState.settings.setPlayAgainEnabled(
    await getSetting(
      'auto-gameflow/play-again-enabled',
      autoGameflowState.settings.playAgainEnabled
    )
  )

  autoGameflowState.settings.setAutoAcceptEnabled(
    await getSetting(
      'auto-gameflow/auto-accept-enabled',
      autoGameflowState.settings.autoAcceptEnabled
    )
  )

  autoGameflowState.settings.setAutoAcceptDelaySeconds(
    await getSetting(
      'auto-gameflow/auto-accept-delay-seconds',
      autoGameflowState.settings.autoAcceptDelaySeconds
    )
  )

  autoGameflowState.settings.setAutoAcceptDelaySeconds(
    await getSetting(
      'auto-gameflow/auto-accept-delay-seconds',
      autoGameflowState.settings.autoAcceptDelaySeconds
    )
  )

  autoGameflowState.settings.setAutoSearchMatchEnabled(
    await getSetting(
      'auto-gameflow/auto-search-match-enabled',
      autoGameflowState.settings.autoSearchMatchEnabled
    )
  )

  autoGameflowState.settings.setAutoSearchMatchDelaySeconds(
    await getSetting(
      'auto-gameflow/auto-search-match-delay-seconds',
      autoGameflowState.settings.autoSearchMatchDelaySeconds
    )
  )
}

const acceptMatch = async () => {
  try {
    await accept()
  } catch (error) {
    mwNotification.warn('auto-gameflow', '自动接受', '尝试接受对局时出现问题')
    logger.warn(`无法接受对局 ${formatError(error)}`)
  }
  autoGameflowState.clearAutoAccept()
  autoSearchMatchTimerId = null
}

const startMatchmaking = async () => {
  try {
    if (autoSearchMatchCountdownTimerId) {
      clearInterval(autoSearchMatchCountdownTimerId)
      autoSearchMatchCountdownTimerId = null
    }
    await searchMatch()
  } catch (error) {
    mwNotification.warn('auto-gameflow', '自动匹配', '尝试开始匹配时出现问题')
    logger.warn(`无法开始匹配 ${formatError(error)}`)
  }
  autoGameflowState.clearAutoSearchMatch()
  autoSearchMatchTimerId = null
}

const printAutoSearchMatchInfo = async (
  cancel?: 'normal' | 'waiting-for-invitee' | 'not-the-leader'
) => {
  if (chat.conversations.customGame && autoGameflowState.willSearchMatch) {
    if (cancel === 'normal') {
      chatSend(chat.conversations.customGame.id, `[League Akari] 自动匹配已取消`).catch()
      return
    } else if (cancel === 'waiting-for-invitee') {
      chatSend(
        chat.conversations.customGame.id,
        `[League Akari] 自动匹配已取消，等待被邀请者`
      ).catch()
      return
    } else if (cancel === 'not-the-leader') {
      chatSend(
        chat.conversations.customGame.id,
        `[League Akari] 自动匹配已取消，当前不是房间房主`
      ).catch()
      return
    }

    const time = (autoGameflowState.willSearchMatchAt - Date.now()) / 1e3
    chatSend(
      chat.conversations.customGame.id,
      `[League Akari] 将在 ${Math.abs(time).toFixed()} 秒后自动匹配`
    ).catch()
  }
}

export function cancelAutoAccept(declined = false) {
  if (autoGameflowState.willAccept) {
    if (autoAcceptTimerId) {
      clearTimeout(autoAcceptTimerId)
      autoAcceptTimerId = null
    }
    autoGameflowState.clearAutoAccept()
    if (declined) {
      logger.info(`取消了即将进行的接受 - 已被玩家通过客户端操作取消`)
    } else {
      logger.info(`取消了即将进行的接受 - 已被玩家取消`)
    }
  }
}

export function cancelAutoSearchMatch(reason: 'normal' | 'waiting-for-invitee' | 'not-the-leader') {
  if (autoGameflowState.willSearchMatch) {
    if (autoSearchMatchTimerId) {
      clearTimeout(autoSearchMatchTimerId)
      autoSearchMatchTimerId = null
    }
    if (autoSearchMatchCountdownTimerId) {
      printAutoSearchMatchInfo(reason)
      clearInterval(autoSearchMatchCountdownTimerId)
      autoSearchMatchCountdownTimerId = null
    }
    autoGameflowState.clearAutoSearchMatch()
    logger.info(`即将进行的自动匹配对局已取消，${reason}`)
  }
}
