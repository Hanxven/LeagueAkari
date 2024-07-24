import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { LootCraftResponse, LootMap } from '@shared/types/lcu/loot'

export function getLootMap() {
  return lcm.lcuRequest<LootMap>({
    url: '/lol-loot/v1/player-loot-map',
    method: 'GET'
  })
}

export function craftLoot(loot: string, repeat = 1) {
  return lcm.lcuRequest<LootCraftResponse>({
    url: `/lol-loot/v1/recipes/${loot}/craft?repeat=${repeat}`,
    method: 'POST'
  })
}
