import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { PlayerList } from '@shared/types/game-client'

export function getPlayerList() {
  return lcm.gcHttp<PlayerList[]>({
    url: '/liveclientdata/playerlist',
    method: 'GET'
  })
}
