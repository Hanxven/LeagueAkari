import { BallotLegacy } from '@shared/types/lcu/honorV2'

import { request } from './common'

export function honor(
  gameId: string | number,
  honorCategory: 'COOL' | 'SHOTCALLER' | 'HEART' | '' | 'OPT_OUT',
  summonerId?: string | number,
  puuid?: string
) {
  return request({
    url: '/lol-honor-v2/v1/honor-player',
    method: 'POST',
    data: {
      gameId,
      honorCategory,
      summonerId,
      puuid
    }
  })
}

export function getBallot() {
  return request<BallotLegacy>({
    url: '/lol-honor-v2/v1/ballot',
    method: 'GET'
  })
}
