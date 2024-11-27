import { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import { AxiosInstance } from 'axios'

export class MatchHistoryHttpApi {
  constructor(private _http: AxiosInstance) {}

  getCurrentSummonerMatchHistory() {
    return this._http.get<MatchHistory>(
      '/lol-match-history/v1/products/lol/current-summoner/matches'
    )
  }

  getMatchHistory(puuid: string, begIndex: number = 0, endIndex: number = 19) {
    return this._http.get<MatchHistory>(`/lol-match-history/v1/products/lol/${puuid}/matches`, {
      params: {
        begIndex,
        endIndex
      }
    })
  }

  getGame(gameId: number) {
    return this._http.get<Game>(`/lol-match-history/v1/games/${gameId}`)
  }

  getTimeline(gameId: number) {
    return this._http.get<GameTimeline>(`/lol-match-history/v1/game-timelines/${gameId}`)
  }
}
