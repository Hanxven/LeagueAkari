import { AxiosInstance } from 'axios'

export class EndOfGameHttpApi {
  constructor(private _http: AxiosInstance) {}

  dismissStats() {
    return this._http.post<void>('/lol-end-of-game/v1/state/dismiss-stats')
  }
}
