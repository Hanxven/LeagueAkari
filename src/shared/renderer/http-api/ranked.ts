import { RankedStats } from '@shared/types/lcu/ranked'

import { request } from './common'

export function getCurrentRankedStats() {
  return request<RankedStats>({
    method: 'GET',
    url: '/lol-ranked/v1/current-ranked-stats'
  })
}
export function getRankedStats(puuid: string) {
  return request<RankedStats>({
    method: 'GET',
    url: `/lol-ranked/v1/ranked-stats/${puuid}`
  })
}
