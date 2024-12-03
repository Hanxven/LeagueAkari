import { Mastery, PlayerChampionMastery } from '@shared/types/league-client/champion-mastery'
import { AxiosInstance } from 'axios'

export class ChampionMasteryHttpApi {
  constructor(private _http: AxiosInstance) {}

  getPlayerChampionMasteryTopN(puuid: string, count = 3) {
    return this._http.post<PlayerChampionMastery>(
      `/lol-champion-mastery/v1/${puuid}/champion-mastery/top`,
      { skipCache: true },
      {
        params: { count }
      }
    )
  }

  getPlayerChampionMastery(puuid: string) {
    return this._http.get<Mastery[]>(`/lol-champion-mastery/v1/${puuid}/champion-mastery`)
  }

  ackNotifications() {
    return this._http.post<void>('/lol-champion-mastery/v1/notifications/ack')
  }
}
