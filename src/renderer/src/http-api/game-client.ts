import { PlayerList } from '@shared/types/game-client'
import { gameClientRequest } from './common'

export function getPlayerList() {
  return gameClientRequest<PlayerList[]>({
    url: '/liveclientdata/playerlist',
    method: 'GET'
  })
}