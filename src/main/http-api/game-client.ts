import { PlayerList } from '@shared/types/game-client'

import { gameClientHttpRequest } from '../core-modules/lcu-connection'

export function getPlayerList() {
  return gameClientHttpRequest<PlayerList[]>({
    url: '/liveclientdata/playerlist',
    method: 'GET'
  })
}
