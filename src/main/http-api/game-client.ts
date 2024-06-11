import { gameClientHttpRequest } from '@main/modules/akari-core/lcu-connection'
import { PlayerList } from '@shared/types/game-client'

export function getPlayerList() {
  return gameClientHttpRequest<PlayerList[]>({
    url: '/liveclientdata/playerlist',
    method: 'GET'
  })
}
