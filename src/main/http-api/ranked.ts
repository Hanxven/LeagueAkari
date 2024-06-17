import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { RankedStats } from '@shared/types/lcu/ranked'

export function getCurrentRankedStats() {
  return lcm.request<RankedStats>({
    method: 'GET',
    url: '/lol-ranked/v1/current-ranked-stats'
  })
}
export function getRankedStats(puuid: string) {
  return lcm.request<RankedStats>({
    method: 'GET',
    url: `/lol-ranked/v1/ranked-stats/${puuid}`
  })
}
