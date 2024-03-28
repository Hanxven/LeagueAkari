import { honor } from '@renderer/http-api/honor-v2'
import { getEogStatus } from '@renderer/http-api/lobby'
import { getGame } from '@renderer/http-api/match-history'
import { getSummonerByPuuid } from '@renderer/http-api/summoner'
import { Ballot } from '@shared/types/lcu/honorV2'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useSummonerStore } from './stores/lcu/summoner'
import { useMatchHistoryStore } from './stores/match-history'
import { useSettingsStore } from './stores/settings'
import { onLcuEvent } from './update/lcu-events'

const HONOR_CATEGORY = ['COOL', 'SHOTCALLER', 'HEART'] as const

/**
 * 在游戏结束后，自动点赞一秒队友
 * prefer-lobby-member, only-lobby-member, all-member, opt-out
 */
export function setupAutoHonor() {
  const settings = useSettingsStore()
  const summoner = useSummonerStore()

  loadSettingsFromStorage()

  onLcuEvent<Ballot>('/lol-honor-v2/v1/ballot', async (message) => {
    if (message.eventType === 'Create' && settings.autoHonor.enabled) {
      if (settings.autoHonor.strategy === 'opt-out') {
        await honor(message.data.gameId, 'OPT_OUT', 0)
        return
      }

      const eligiblePlayers = message.data.eligiblePlayers
      const honorablePlayerIds: number[] = []

      if (settings.autoHonor.strategy === 'all-member') {
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
          await Promise.all(lobbyMemberPuuids.map(async (p) => (await getSummonerByPuuid(p)).data))
        ).filter((p) => p.summonerId !== summoner.currentSummoner?.summonerId)

        // DEBUGGING
        console.log('结算可用的房间玩家', lobbyMemberSummoners)

        const honorableLobbyMembers = lobbyMemberSummoners.filter((p) =>
          eligiblePlayerIds.has(p.summonerId)
        )

        if (settings.autoHonor.strategy === 'only-lobby-member') {
          honorablePlayerIds.push(...honorableLobbyMembers.map((p) => p.summonerId))
        } else if (settings.autoHonor.strategy === 'prefer-lobby-member') {
          if (honorableLobbyMembers.length === 0) {
            honorablePlayerIds.push(...eligiblePlayers.map((p) => p.summonerId))
          } else {
            honorablePlayerIds.push(...honorableLobbyMembers.map((p) => p.summonerId))
          }
        }
      }

      if (honorablePlayerIds.length) {
        const category = HONOR_CATEGORY[Math.floor(Math.random() * HONOR_CATEGORY.length)]
        const candidate = honorablePlayerIds[Math.floor(Math.random() * honorablePlayerIds.length)]
        await honor(message.data.gameId, category, candidate)
        
        // DEBUGGING
        console.log('最终点赞玩家 ID', candidate)
      }
    }
  })
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.autoHonor.enabled = getSetting('autoHonor.enabled', false)
  settings.autoHonor.strategy = getSetting('autoHonor.strategy', 'prefer-lobby-member')
}

export function setEnableAutoHonor(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoHonor.enabled', enabled)
  settings.autoHonor.enabled = enabled
}

export function setAutoHonorStrategy(strategy: string) {
  const settings = useSettingsStore()

  setSetting('autoHonor.strategy', strategy)
  settings.autoHonor.strategy = strategy
}
