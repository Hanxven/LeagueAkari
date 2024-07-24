import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { GetSearch } from '@shared/types/lcu/matchmaking'

export function accept() {
  return lcm.lcuRequest({
    method: 'POST',
    url: '/lol-matchmaking/v1/ready-check/accept'
  })
}
export function decline() {
  return lcm.lcuRequest({
    method: 'POST',
    url: '/lol-matchmaking/v1/ready-check/decline'
  })
}

export function getSearch() {
  return lcm.lcuRequest<GetSearch>({
    url: '/lol-matchmaking/v1/search',
    method: 'GET'
  })
}
