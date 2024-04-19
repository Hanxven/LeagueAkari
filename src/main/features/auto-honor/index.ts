import { lcuEventEmitter } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { mwNotification } from '@main/core/main-window'
import { honor } from '@main/http-api/honor-v2'
import { getEogStatus } from '@main/http-api/lobby'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { LcuEvent } from '@shared/types/lcu/event'
import { Ballot } from '@shared/types/lcu/honorV2'
import { formatError } from '@shared/utils/errors'

import { summoner } from '../lcu-state-sync/summoner'
import { autoHonorState } from './state'

const HONOR_CATEGORY = ['COOL', 'SHOTCALLER', 'HEART'] as const

const logger = createLogger('auto-honor')

export async function setupAutoHonor() {
  stateSync()
  ipcCall()
  await loadSettings()

  lcuEventEmitter.on<LcuEvent<Ballot>>('/lol-honor-v2/v1/ballot', async (message) => {
    if (message.eventType === 'Create' && autoHonorState.settings.enabled) {
      try {
        if (autoHonorState.settings.strategy === 'opt-out') {
          await honor(message.data.gameId, 'OPT_OUT', 0)
          return
        }

        const eligiblePlayers = message.data.eligiblePlayers
        const honorablePlayerIds: number[] = []

        if (autoHonorState.settings.strategy === 'all-member') {
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

          if (autoHonorState.settings.strategy === 'only-lobby-member') {
            honorablePlayerIds.push(...honorableLobbyMembers.map((p) => p.summonerId))
          } else if (autoHonorState.settings.strategy === 'prefer-lobby-member') {
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
        }
      } catch (error) {
        mwNotification.warn('auto-honor', '自动点赞', '尝试自动点赞出现问题')
        logger.warn(`Failed to honor a player ${formatError(error)}`)
      }
    }
  })

  logger.info('Initialized')
}

function stateSync() {
  ipcStateSync('auto-honor/settings/enabled', () => autoHonorState.settings.enabled)
  ipcStateSync('auto-honor/settings/strategy', () => autoHonorState.settings.strategy)
}

function ipcCall() {
  onRendererCall('auto-honor/settings/enabled/set', async (_, enabled) => {
    autoHonorState.settings.setEnabled(enabled)
    await setSetting('auto-honor/enabled', enabled)
  })

  onRendererCall('auto-accept/settings/strategy/set', async (_, strategy) => {
    autoHonorState.settings.setStrategy(strategy)
    await setSetting('auto-honor/strategy', strategy)
  })
}

async function loadSettings() {
  autoHonorState.settings.setEnabled(
    await getSetting('auto-honor/enabled', autoHonorState.settings.enabled)
  )

  autoHonorState.settings.setStrategy(
    await getSetting('auto-honor/strategy', autoHonorState.settings.strategy)
  )
}
