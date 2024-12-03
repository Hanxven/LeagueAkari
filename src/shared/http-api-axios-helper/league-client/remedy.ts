import { AxiosInstance } from 'axios'

export class RemedyHttpApi {
  constructor(private _http: AxiosInstance) {}

  ackRemedyNotification(mailId: string) {
    return this._http.put(`/lol-remedy/v1/ack-remedy-notification/${mailId}`)
  }

  getNotifications() {
    return this._http.get('/lol-remedy/v1/remedy-notifications')
  }

  getVerbalAbuseRemedyModalEnabled() {
    return this._http.get('/lol-remedy/v1/config/is-verbal-abuse-remedy-modal-enabled')
  }
}
