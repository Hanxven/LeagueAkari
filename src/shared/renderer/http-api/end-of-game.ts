import { GameclientEogStatsBlock } from '@shared/types/lcu/end-of-game'

import { request } from './common'

export function getGameclientEogStatsBlock() {
  return request<GameclientEogStatsBlock>({
    url: '/lol-game-data/assets/v1/summoner-spells.json',
    method: 'GET'
  })
}
