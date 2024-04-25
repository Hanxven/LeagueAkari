import { request } from './common'

export function launchSpectator(puuid: string) {
  return request({
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
