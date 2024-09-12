import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { PlayerNotifications } from '@shared/types/lcu/player-notifications'

export function createNotification(data: Partial<PlayerNotifications>) {
  return lcm.lcuRequest({
    method: 'POST',
    url: '/player-notifications/v1/notifications',
    data
  })
}
