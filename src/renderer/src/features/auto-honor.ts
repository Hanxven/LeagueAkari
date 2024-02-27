import { honor } from '@renderer/http-api/honor-v2'
import { getEogStatus } from '@renderer/http-api/lobby'
import { getSummonerByPuuid } from '@renderer/http-api/summoner'
import { Ballot } from '@renderer/types/honorV2'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useSummonerStore } from './stores/lcu/summoner'
import { useSettingsStore } from './stores/settings'
import { onLcuEvent } from './update/lcu-events'

const HONOR_CATEGORY = ['COOL', 'SHOTCALLER', 'HEART'] as const

/**
 * 在游戏结束后，自动点赞一秒队友
 */
export function setupAutoHonor() {
  const settings = useSettingsStore()
  const summoner = useSummonerStore()

  loadSettingsFromStorage()

  onLcuEvent<Ballot>('/lol-honor-v2/v1/ballot', async (message) => {
    if (message.eventType === 'Create' && settings.autoHonor.enabled) {
      const eligiblePlayers = message.data.eligiblePlayers.map((p) => p.summonerId)

      let candidate: number | string | null = null
      if (settings.autoHonor.strategy === 'random-all') {
        candidate = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)]
      } else if (settings.autoHonor.strategy === 'random-lobby-member') {
        const eogStatus = (await getEogStatus()).data
        const lobbyMemberPuuids = [
          ...eogStatus.eogPlayers,
          ...eogStatus.leftPlayers,
          ...eogStatus.readyPlayers
        ]

        const lobbyMemberSummonerIds = await Promise.all(
          lobbyMemberPuuids.map(async (p) => (await getSummonerByPuuid(p)).data)
        )

        const eligibles = lobbyMemberSummonerIds.filter(
          (e) =>
            e.summonerId !== summoner.currentSummoner?.summonerId &&
            eligiblePlayers.includes(e.summonerId)
        )

        candidate = eligibles[Math.floor(Math.random() * eligibles.length)].summonerId
      } else if (settings.autoHonor.strategy === 'opt-out') {
        await honor(message.data.gameId, 'OPT_OUT', 0)
      }

      if (!candidate) {
        return
      }

      const category = HONOR_CATEGORY[Math.floor(Math.random() * HONOR_CATEGORY.length)]
      console.log('自动点赞 - 给 summonerId 为', candidate, category)

      const r = await honor(message.data.gameId, category, candidate)
      console.log('自动点赞结果', r.data)
    }
  })
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.autoHonor.enabled = getSetting('autoHonor.enabled', false)
  settings.autoHonor.strategy = getSetting('autoHonor.strategy', 'random-all')
}

export function setEnableAutoHonor(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoHonor.enabled', enabled)
  settings.autoHonor.enabled = enabled
}

export function setAutoHonorStrategy(strategy: string) {
  const settings = useSettingsStore()

  setSetting('autoHonor.strategy', strategy)
  settings.autoHonor.strategy = strategy as 'random-all' | 'random-lobby-member'
}
