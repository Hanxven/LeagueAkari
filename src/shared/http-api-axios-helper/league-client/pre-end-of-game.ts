import { AxiosInstance } from 'axios'

export class PreEndOfGameHttpApi {
  constructor(private _http: AxiosInstance) {}

  complete(sequenceEventName: string) {
    return this._http.post(`/lol-pre-end-of-game/v1/complete/${sequenceEventName}`)
  }

  getCurrentSequenceEvent() {
    return this._http.get('/lol-pre-end-of-game/v1/currentSequenceEvent')
  }
}
