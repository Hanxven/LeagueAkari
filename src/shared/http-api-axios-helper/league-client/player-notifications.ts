import { PlayerNotifications } from '@shared/types/league-client/player-notifications'
import { AxiosInstance } from 'axios'

export class PlayerNotificationsHttpApi {
  constructor(private _http: AxiosInstance) {}

  postNotification(data: Partial<PlayerNotifications>) {
    return this._http.post('/player-notifications/v1/notifications', data)
  }

  /**
   * 一个预设通知
   */
  createTitleDetailsNotification(title: string, details: string) {
    return this.postNotification({
      critical: true,
      data: {
        details,
        title
      },
      detailKey: 'pre_translated_details',
      dismissible: true,
      state: 'toast',
      titleKey: 'pre_translated_title',
      type: 'default'
    })
  }
}
