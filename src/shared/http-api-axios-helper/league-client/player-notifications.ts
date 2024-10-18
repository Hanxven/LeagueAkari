import { PlayerNotifications } from '@shared/types/league-client/player-notifications'
import { AxiosInstance } from 'axios'

export class PlayerNotificationsHttpApi {
  constructor(private _http: AxiosInstance) {}

  createNotification(data: Partial<PlayerNotifications>) {
    return this._http.post('/player-notifications/v1/notifications', data)
  }
}
