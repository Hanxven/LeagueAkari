import { AccountScopeLoadouts } from '@shared/types/lcu/game-data'

import { request } from './common'

export function setStrawberryDifficulty(contentId: string, difficulty: number) {
  return request({
    url: `/lol-loadouts/v4/loadouts/${contentId}`,
    method: 'PATCH',
    data: {
      loadout: { STRAWBERRY_DIFFICULTY: { inventoryType: 'STRAWBERRY_LOADOUT_ITEM', itemId: difficulty } }
    }
  })
}

export function getAccountScopeLoadouts() {
  return request<AccountScopeLoadouts[]>({
    url: '/lol-loadouts/v4/loadouts/scope/account',
    method: 'GET'
  })
}
