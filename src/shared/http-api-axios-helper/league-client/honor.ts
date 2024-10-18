import { Ballot } from '@shared/types/league-client/honorV2'
import { AxiosInstance } from 'axios'

export class HonorHttpApi {
  constructor(private _http: AxiosInstance) {}

  ballot() {
    return this._http.post('/lol-honor/v1/ballot')
  }

  honor(honorType: string, recipientPuuid: string) {
    return this._http.post('/lol-honor/v1/honor', {
      honorType,
      recipientPuuid
    })
  }

  v2Honor(
    gameId: string | number,
    honorCategory: 'COOL' | 'SHOTCALLER' | 'HEART' | '' | 'OPT_OUT',
    summonerId?: string | number,
    puuid?: string
  ) {
    return this._http.post('/lol-honor-v2/v1/honor-player/', {
      gameId,
      honorCategory,
      summonerId,
      puuid
    })
  }

  getV2Ballot() {
    return this._http.get<Ballot>('/lol-honor-v2/v1/ballot/')
  }
}
