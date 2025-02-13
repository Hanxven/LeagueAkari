import { AxiosInstance } from 'axios'

export class SpectatorHttpApi {
  constructor(private _http: AxiosInstance) {}

  launchSpectator(puuid: string) {
    return this._http.post('/lol-spectator/v1/spectate/launch', {
      allowObserveMode: 'ALL',
      dropInSpectateGameId: '',
      gameQueueType: '',
      puuid
    })
  }
}
