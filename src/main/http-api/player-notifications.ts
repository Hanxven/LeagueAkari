import { PlayerNotifications } from '@shared/types/lcu/player-notifications'

import { request } from './common'

export function createNotification(data: Partial<PlayerNotifications>) {
  return request({
    method: 'POST',
    url: '/player-notifications/v1/notifications',
    data
  })
}
