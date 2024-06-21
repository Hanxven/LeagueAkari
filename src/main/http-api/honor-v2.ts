import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { BallotLegacy } from '@shared/types/lcu/honorV2'

export function honor(
  gameId: string | number,
  honorCategory: 'COOL' | 'SHOTCALLER' | 'HEART' | '' | 'OPT_OUT',
  summonerId?: string | number,
  puuid?: string
) {
  return lcm.request({
    url: '/lol-honor-v2/v1/honor-player/',
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
  return lcm.request<BallotLegacy>({
    url: '/lol-honor-v2/v1/ballot/',
    method: 'GET'
  })
}
