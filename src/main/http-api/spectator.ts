import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'

export function launchSpectator(puuid: string) {
  return lcm.lcuRequest({
    method: 'POST',
    url: '/lol-spectator/v1/spectate/launch',
    data: {
      allowObserveMode: 'ALL',
      dropInSpectateGameId: '',
      gameQueueType: '',
      puuid
    }
  })
}
