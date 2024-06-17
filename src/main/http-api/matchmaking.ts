import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { GetSearch } from '@shared/types/lcu/matchmaking'

export function accept() {
  return lcm.request({
    method: 'POST',
    url: '/lol-matchmaking/v1/ready-check/accept'
  })
}
export function decline() {
  return lcm.request({
    method: 'POST',
    url: '/lol-matchmaking/v1/ready-check/decline'
  })
}

export function getSearch() {
  return lcm.request<GetSearch>({
    url: '/lol-matchmaking/v1/search',
    method: 'GET'
  })
}
