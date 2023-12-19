import { LootCraftResponse, LootMap } from '@renderer/types/loot'

import { request } from './common'

export function getLootMap() {
  return request<LootMap>({
    url: '/lol-loot/v1/player-loot-map',
    method: 'GET'
  })
}

export function craftLoot(loot: string, repeat = 1) {
  return request<LootCraftResponse>({
    url: `/lol-loot/v1/recipes/${loot}/craft?repeat=${repeat}`,
    method: 'POST'
  })
}
