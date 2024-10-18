import { GetSearch } from '@shared/types/league-client/matchmaking'
import { AxiosInstance } from 'axios'

export class MatchmakingHttpApi {
  constructor(private _http: AxiosInstance) {}

  accept() {
    return this._http.post('/lol-matchmaking/v1/ready-check/accept')
  }

  decline() {
    return this._http.post('/lol-matchmaking/v1/ready-check/decline')
  }

  getSearch() {
    return this._http.get<GetSearch>('/lol-matchmaking/v1/search')
  }
}
