import { RankedStats } from '@shared/types/league-client/ranked'
import { AxiosInstance } from 'axios'

export class RankedHttpApi {
  constructor(private _http: AxiosInstance) {}

  getCurrentRankedStats() {
    return this._http.get<RankedStats>('/lol-ranked/v1/current-ranked-stats')
  }

  getRankedStats(puuid: string) {
    return this._http.get<RankedStats>(`/lol-ranked/v1/ranked-stats/${puuid}`)
  }

  acknowledgeEosNotification(id: string) {
    return this._http.post(`/lol-ranked/v1/eos-notifications/${id}/acknowledge`)
  }

  acknowledgeNotification(id: string) {
    return this._http.post(`/lol-ranked/v1/notifications/${id}/acknowledge`)
  }
}
