import { RankedStats } from '@shared/types/lcu/ranked'
import { AxiosInstance } from 'axios'

export class RankedHttpApi {
  constructor(private _http: AxiosInstance) {}

  getCurrentRankedStats() {
    return this._http.get<RankedStats>('/lol-ranked/v1/current-ranked-stats')
  }

  getRankedStats(puuid: string) {
    return this._http.get<RankedStats>(`/lol-ranked/v1/ranked-stats/${puuid}`)
  }
}
