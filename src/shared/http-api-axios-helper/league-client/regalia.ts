import { AxiosInstance } from 'axios'

export class RegaliaHttpApi {
  constructor(private _http: AxiosInstance) {}

  updateRegalia(dto: object) {
    return this._http.put('/lol-regalia/v2/current-summoner/regalia', dto)
  }

  getRegalia() {
    return this._http.get('/lol-regalia/v2/current-summoner/regalia')
  }
}
