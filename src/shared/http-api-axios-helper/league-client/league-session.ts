import { AxiosInstance } from 'axios'

export class LeagueSessionHttpApi {
  constructor(private _http: AxiosInstance) {}

  getLeagueSessionToken() {
    return this._http.get<string>('/lol-league-session/v1/league-session-token')
  }
}
