import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { PlayerNotifications } from '@shared/types/lcu/player-notifications'

export function createNotification(data: Partial<PlayerNotifications>) {
  return lcm.request({
    method: 'POST',
    url: '/player-notifications/v1/notifications',
    data
  })
}
