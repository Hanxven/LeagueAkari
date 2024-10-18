import { AxiosInstance } from 'axios'

export class LolLeagueSessionHttpApi {
  constructor(private _http: AxiosInstance) {}

  getLolLeagueSessionToken() {
    return this._http.get<string>('/lol-league-session/v1/league-session-token')
  }
}
