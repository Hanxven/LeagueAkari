import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { Ballot } from '@shared/types/lcu/honorV2'

export function ballot() {
  return lcm.lcuRequest({
    url: '/lol-honor/v1/ballot',
    method: 'POST'
  })
}

export function honor(honorType: string, recipientPuuid: string) {
  return lcm.lcuRequest({
    url: '/lol-honor/v1/honor',
    method: 'POST',
    data: {
      honorType,
      recipientPuuid
    }
  })
}

export function v2Honor(
  gameId: string | number,
  honorCategory: 'COOL' | 'SHOTCALLER' | 'HEART' | '' | 'OPT_OUT',
  summonerId?: string | number,
  puuid?: string
) {
  return lcm.lcuRequest({
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

export function getV2Ballot() {
  return lcm.lcuRequest<Ballot>({
    url: '/lol-honor-v2/v1/ballot/',
    method: 'GET'
  })
}
