import { lcuConnectionModule } from '@main/modules/akari-core/lcu-connection'
import { PlayerList } from '@shared/types/game-client'

export function getPlayerList() {
  return lcuConnectionModule.gcHttp<PlayerList[]>({
    url: '/liveclientdata/playerlist',
    method: 'GET'
  })
}
