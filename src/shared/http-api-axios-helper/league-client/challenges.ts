import { AxiosInstance } from 'axios'

export class ChallengesHttpApi {
  constructor(private _http: AxiosInstance) {}

  updatePlayerPreferences(config: object) {
    return this._http.post<void>('/lol-challenges/v1/update-player-preferences/', config)
  }

  ackChallengeUpdate(id: number) {
    return this._http.post<void>(`/lol-challenges/v1/ack-challenge-update/${id}`)
  }
}
