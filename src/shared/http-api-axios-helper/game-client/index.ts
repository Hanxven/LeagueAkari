import { PlayerList } from '@shared/types/game-client'
import { AxiosInstance } from 'axios'

export class GameClientHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {}

  getLiveClientDataPlayerList() {
    return this._http.get<PlayerList[]>('/liveclientdata/playerlist')
  }
}
