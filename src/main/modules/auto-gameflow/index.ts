import { lcuEventBus } from '@main/core-modules/lcu-connection'
import { createLogger } from '@main/core-modules/log'
import { mwNotification } from '@main/core-modules/main-window'
import { chatSend } from '@main/http-api/chat'
import { honor } from '@main/http-api/honor-v2'
import { deleteSearchMatch, getEogStatus, playAgain, searchMatch } from '@main/http-api/lobby'
import { accept } from '@main/http-api/matchmaking'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { TimeoutTask } from '@main/utils/timer'
import { formatError } from '@shared/utils/errors'
import { comparer, computed, reaction } from 'mobx'

import { chat } from '../lcu-state-sync/chat'
import { gameflow } from '../lcu-state-sync/gameflow'
import { honorState } from '../lcu-state-sync/honor'
import { matchmaking } from '../lcu-state-sync/matchmaking'
import { summoner } from '../lcu-state-sync/summoner'
import { AutoRematchStrategy as AutoSearchRematchStrategy, autoGameflowState } from './state'

const HONOR_CATEGORY = ['COOL', 'SHOTCALLER', 'HEART'] as const

const logger = createLogger('auto-gameflow')

let autoAcceptTimerId: NodeJS.Timeout | null = null
let autoSearchMatchTimerId: NodeJS.Timeout | null = null
let autoSearchMatchCountdownTimerId: NodeJS.Timeout | null = null

// 等待点赞页面的最大时间
const PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT = 3250

// 预留时间
const PLAY_AGAIN_BUFFER_TIMEOUT = 750

async function playAgainFn() {
  try {
    logger.info('Play again, 返回房间')
    await playAgain()
  } catch (error) {
    logger.warn(`尝试 Play again 时失败 ${formatError(error)}`)
  }
}

const playAgainTask = new TimeoutTask(playAgainFn)

export async function setupAutoGameflow() {
  stateSync()
  ipcCall()
  await loadSettings()

  // 自动点赞
  reaction(
    () => [honorState.ballot, autoGameflowState.settings.autoHonorEnabled] as const,
    async ([b, e]) => {
      if (b) {
        playAgainTask.cancel()
      }

      if (b && e) {
        try {
          if (autoGameflowState.settings.autoHonorStrategy === 'opt-out') {
            await honor(b.gameId, 'OPT_OUT', 0)
            return
          }

          const eligiblePlayers = b.eligiblePlayers
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

            await honor(b.gameId, category, candidate)

            logger.info(`给玩家: ${candidate} 点赞, for ${category}, game ID: ${b.gameId}`)
          } else {
            await honor(b.gameId, 'OPT_OUT', 0)
            logger.info('跳过点赞阶段')
          }
        } catch (error) {
          mwNotification.warn('auto-gameflow', '自动点赞', '尝试自动点赞出现问题')
          logger.warn(`无法给玩家点赞 ${formatError(error)}`)
        }
      }
    },
    { equals: comparer.shallow /* ballot 不会 Update，只会 Create 和 Delete */ }
  )

  reaction(
    () => [gameflow.phase, autoGameflowState.settings.playAgainEnabled] as const,
    async ([phase, enabled]) => {
      if (!enabled || (phase !== 'PreEndOfGame' && phase !== 'EndOfGame')) {
        playAgainTask.cancel()
        return
      }

      // 在某些模式中，可能会出现仅有 PreEndOfGame 的情况，需要做一个计时器
      if (phase === 'PreEndOfGame' && enabled) {
        playAgainTask.start(PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT)
        return
      }

      if (phase === 'EndOfGame' && enabled) {
        playAgainTask.start(PLAY_AGAIN_BUFFER_TIMEOUT)
        return
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
        cancelAutoAccept('normal')
      }
    }
  )

  // 如果玩家手动取消了本次接受，则尝试取消即将进行的自动接受（如果有）
  lcuEventBus.on('/lol-matchmaking/v1/ready-check', (event) => {
    if (
      event.data &&
      (event.data.playerResponse === 'Declined' || event.data.playerResponse === 'Accepted')
    ) {
      cancelAutoAccept('declined')
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
      } else {
        cancelAutoSearchMatch(s)
      }
    },
    { equals: comparer.shallow }
  )

  const simplifiedSearchState = computed(() => {
    if (!matchmaking.search) {
      return null
    }

    return {
      timeInQueue: matchmaking.search.timeInQueue,
      estimatedQueueTime: matchmaking.search.estimatedQueueTime,
      searchState: matchmaking.search.searchState,
      lowPriorityData: matchmaking.search.lowPriorityData
    }
  })

  reaction(
    () =>
      [
        simplifiedSearchState.get(),
        autoGameflowState.settings.autoSearchMatchRematchStrategy,
        autoGameflowState.settings.autoSearchMatchRematchFixedDuration
      ] as const,
    ([s, st, d]) => {
      if (st === 'never' || !s || s.searchState !== 'Searching') {
        return
      }

      const penaltyTime = s.lowPriorityData.penaltyTime

      if (st === 'fixed-duration') {
        if (s.timeInQueue + penaltyTime >= d) {
          deleteSearchMatch().catch((e) => {
            logger.warn(`尝试取消匹配时失败 ${formatError(e)}`)
          })
          return
        }
      } else if (st === 'estimated-duration') {
        if (s.timeInQueue + penaltyTime >= s.estimatedQueueTime) {
          deleteSearchMatch().catch((e) => {
            logger.warn(`尝试取消匹配时失败 ${formatError(e)}`)
          })
        }
      }
    },
    { equals: comparer.structural }
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

  ipcStateSync(
    'auto-gameflow/settings/auto-search-match-minimum-members',
    () => autoGameflowState.settings.autoSearchMatchMinimumMembers
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-search-match-wait-for-invitees',
    () => autoGameflowState.settings.autoSearchMatchWaitForInvitees
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-search-match-rematch-strategy',
    () => autoGameflowState.settings.autoSearchMatchRematchStrategy
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-search-match-rematch-fixed-duration',
    () => autoGameflowState.settings.autoSearchMatchRematchFixedDuration
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
    cancelAutoAccept('normal')
  })

  onRendererCall('auto-gameflow/settings/auto-accept-enabled/set', async (_, enabled) => {
    if (!enabled) {
      cancelAutoAccept('normal')
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

  onRendererCall(
    'auto-gameflow/settings/auto-search-match-minimum-members/set',
    async (_, members: number) => {
      autoGameflowState.settings.setAutoSearchMatchMinimumMembers(members)
      await setSetting('auto-gameflow/auto-search-minimum-members', members)
    }
  )

  onRendererCall(
    'auto-gameflow/settings/auto-search-match-wait-for-invitees/set',
    async (_, yes: boolean) => {
      autoGameflowState.settings.setAutoSearchMatchWaitForInvitees(yes)
      await setSetting('auto-gameflow/auto-search-match-wait-for-invitees', yes)
    }
  )

  onRendererCall(
    'auto-gameflow/settings/auto-search-match-rematch-strategy/set',
    async (_, s: AutoSearchRematchStrategy) => {
      autoGameflowState.settings.setAutoSearchMatchRematchStrategy(s)
      await setSetting('auto-gameflow/auto-search-match-rematch-strategy', s)
    }
  )

  onRendererCall(
    'auto-gameflow/settings/auto-search-match-rematch-fixed-duration/set',
    async (_, s: number) => {
      autoGameflowState.settings.setAutoSearchMatchRematchFixedDuration(s)
      await setSetting('auto-gameflow/auto-search-match-rematch-fixed-duration', s)
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

  autoGameflowState.settings.setAutoSearchMatchMinimumMembers(
    await getSetting(
      'auto-gameflow/auto-search-minimum-members',
      autoGameflowState.settings.autoSearchMatchMinimumMembers
    )
  )

  autoGameflowState.settings.setAutoSearchMatchWaitForInvitees(
    await getSetting(
      'auto-gameflow/auto-search-wait-for-invitees',
      autoGameflowState.settings.autoSearchMatchWaitForInvitees
    )
  )

  autoGameflowState.settings.setAutoSearchMatchRematchStrategy(
    await getSetting(
      'auto-gameflow/auto-search-match-rematch-strategy',
      autoGameflowState.settings.autoSearchMatchRematchStrategy
    )
  )

  autoGameflowState.settings.setAutoSearchMatchRematchFixedDuration(
    await getSetting(
      'auto-gameflow/auto-search-match-rematch-fixed-duration',
      autoGameflowState.settings.autoSearchMatchRematchFixedDuration
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
    autoGameflowState.clearAutoSearchMatch()
    autoSearchMatchTimerId = null
    await searchMatch()
  } catch (error) {
    mwNotification.warn('auto-gameflow', '自动匹配', '尝试开始匹配时出现问题')
    logger.warn(`无法开始匹配 ${formatError(error)}`)
  }
}

const printAutoSearchMatchInfo = async (cancel?: string) => {
  if (chat.conversations.customGame && autoGameflowState.willSearchMatch) {
    if (cancel === 'normal') {
      chatSend(
        chat.conversations.customGame.id,
        `[League Akari] 自动匹配已取消`,
        'celebration'
      ).catch()
      return
    } else if (cancel === 'waiting-for-invitee') {
      chatSend(
        chat.conversations.customGame.id,
        `[League Akari] 自动匹配已取消，等待被邀请者`,
        'celebration'
      ).catch()
      return
    } else if (cancel === 'not-the-leader') {
      chatSend(
        chat.conversations.customGame.id,
        `[League Akari] 自动匹配已取消，当前不是房间房主`,
        'celebration'
      ).catch()
      return
    }

    const time = (autoGameflowState.willSearchMatchAt - Date.now()) / 1e3
    chatSend(
      chat.conversations.customGame.id,
      `[League Akari] 将在 ${Math.abs(time).toFixed()} 秒后自动匹配`,
      'celebration'
    ).catch()
  }
}

export function cancelAutoAccept(reason: 'accepted' | 'declined' | 'normal') {
  if (autoGameflowState.willAccept) {
    if (autoAcceptTimerId) {
      clearTimeout(autoAcceptTimerId)
      autoAcceptTimerId = null
    }
    autoGameflowState.clearAutoAccept()
    if (reason === 'accepted') {
      logger.info(`取消了即将进行的接受 - 已完成`)
    } else if (reason === 'declined') {
      logger.info(`取消了即将进行的接受 - 已完成`)
    }
  }
}

export function cancelAutoSearchMatch(reason: string) {
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
    3

    autoGameflowState.clearAutoSearchMatch()
    logger.info(`即将进行的自动匹配对局已取消，${reason}`)
  }
}
