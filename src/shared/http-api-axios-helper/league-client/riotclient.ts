import { AxiosInstance } from 'axios'

export class RiotClientHttpApi {
  constructor(private _http: AxiosInstance) {}

  killUx() {
    return this._http.post('/riotclient/kill-ux')
  }

  launchUx() {
    return this._http.post('/riotclient/launch-ux')
  }

  restartUx() {
    return this._http.post('riotclient/kill-and-restart-ux')
  }

  splash() {
    return this._http.put('/riotclient/splash')
  }
}
