import { AxiosInstance } from 'axios'

export class ProcessControlHttpApi {
  constructor(private _http: AxiosInstance) {}

  quit() {
    return this._http.post('/process-control/v1/process/quit')
  }
}
