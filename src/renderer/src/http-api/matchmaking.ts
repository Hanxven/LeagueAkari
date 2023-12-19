import { GetSearch } from '@renderer/types/matchmaking'

import { request } from './common'

export function accept() {
  return request({
    method: 'POST',
    url: '/lol-matchmaking/v1/ready-check/accept'
  })
}
export function decline() {
  return request({
    method: 'POST',
    url: '/lol-matchmaking/v1/ready-check/decline'
  })
}

export function getSearch() {
  return request<GetSearch>({
    url: '/lol-matchmaking/v1/search',
    method: 'GET'
  })
}
