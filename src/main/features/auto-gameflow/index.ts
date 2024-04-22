import { lcuEventBus } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { mwNotification } from '@main/core/main-window'
import { honor } from '@main/http-api/honor-v2'
import { getEogStatus, getLobby, playAgain } from '@main/http-api/lobby'
import { accept } from '@main/http-api/matchmaking'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { LcuEvent } from '@shared/types/lcu/event'
import { Ballot } from '@shared/types/lcu/honorV2'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import { reaction } from 'mobx'

import { gameflow } from '../lcu-state-sync/gameflow'
import { lobby } from '../lcu-state-sync/lobby'
import { summoner } from '../lcu-state-sync/summoner'
import { autoGameflowState } from './state'

const HONOR_CATEGORY = ['COOL', 'SHOTCALLER', 'HEART'] as const

const logger = createLogger('auto-gameflow')

let autoAcceptTimerId: NodeJS.Timeout | null = null

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

          logger.info(
            `Honored summoner ID: ${candidate} for ${category}, game ID: ${message.data.gameId}`
          )
        } else {
          await honor(message.data.gameId, 'OPT_OUT', 0)
          logger.info('Opt-outed honoring stage')
        }
      } catch (error) {
        mwNotification.warn('auto-gameflow', '自动点赞', '尝试自动点赞出现问题')
        logger.warn(`Failed to honor a player ${formatError(error)}`)
      }
    }
  })

  // 自动回到房间
  reaction(
    () => gameflow.phase,
    async (phase) => {
      if (autoGameflowState.settings.playAgainEnabled && phase === 'EndOfGame') {
        try {
          await playAgain()
          logger.info('Play again, returned to the lobby')
        } catch (error) {
          logger.warn(`Error when try to play again ${formatError(error)}`)
        }
      }
    }
  )

  // 自动接受
  reaction(
    () => gameflow.phase,
    (phase) => {
      if (!autoGameflowState.settings.autoAcceptEnabled) {
        return
      }

      if (phase === 'ReadyCheck') {
        autoGameflowState.setAutoAcceptAt(
          Date.now() + autoGameflowState.settings.autoAcceptDelaySeconds * 1e3
        )
        autoAcceptTimerId = setTimeout(
          acceptMatch,
          autoGameflowState.settings.autoAcceptDelaySeconds * 1e3
        )

        logger.info(
          `ReadyCheck! Will accept the match in ${autoGameflowState.settings.autoAcceptDelaySeconds * 1e3} ms`
        )
      } else {
        if (autoAcceptTimerId) {
          if (autoGameflowState.willAutoAccept) {
            logger.info(`Auto accept canceled - not in ReadyCheck phase`)
          }

          clearTimeout(autoAcceptTimerId)
          autoAcceptTimerId = null
        }
        autoGameflowState.clearAutoAccept()
      }
    }
  )

  // 如果玩家手动取消了本次接受，则尝试取消即将进行的自动接受（如果有）
  lcuEventBus.on('/lol-matchmaking/v1/ready-check', (event) => {
    if (event.data && event.data.playerResponse === 'Declined') {
      if (autoGameflowState.willAutoAccept) {
        if (autoAcceptTimerId) {
          logger.info(`Auto accept canceled - declined`)

          clearTimeout(autoAcceptTimerId)
          autoAcceptTimerId = null
        }
        autoGameflowState.clearAutoAccept()
      }
    }
  })

  // 自动开始匹配
  reaction(
    () => lobby.lobby,
    (lobby) => {
      // console.log('lobby', lobby)
    }
  )

  logger.info('Initialized')
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

  ipcStateSync('auto-gameflow/will-auto-accept', () => autoGameflowState.willAutoAccept)

  ipcStateSync('auto-gameflow/will-auto-accept-at', () => autoGameflowState.willAutoAcceptAt)

  ipcStateSync(
    'auto-gameflow/settings/auto-accept-enabled',
    () => autoGameflowState.settings.autoAcceptEnabled
  )

  ipcStateSync(
    'auto-gameflow/settings/auto-accept-delay-seconds',
    () => autoGameflowState.settings.autoAcceptDelaySeconds
  )
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
}

const acceptMatch = async () => {
  try {
    await accept()
  } catch (error) {
    mwNotification.warn('auto-gameflow', '自动接受', '尝试自动接受时出现问题')
    logger.warn(`Failed to accept match ${formatError(error)}`)
  }
  autoGameflowState.clearAutoAccept()
}

export function cancelAutoAccept() {
  if (autoGameflowState.willAutoAccept) {
    if (autoAcceptTimerId) {
      logger.info(`Auto accept canceled - manually canceled`)

      clearTimeout(autoAcceptTimerId)
      autoAcceptTimerId = null
    }
    autoGameflowState.clearAutoAccept()
  }
}
