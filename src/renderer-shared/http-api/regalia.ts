import { Regalia } from '@shared/types/lcu/regalia'

import { request } from './common'

export function updateRegalia(dto: object) {
  return request<Regalia>({
    method: 'PUT',
    url: '/lol-regalia/v2/current-summoner/regalia',
    data: dto
  })
}

export function getRegalia() {
  return request<Regalia>({
    method: 'GET',
    url: '/lol-regalia/v2/current-summoner/regalia'
  })
}
