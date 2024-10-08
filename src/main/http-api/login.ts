import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { LoginQueueState } from '@shared/types/lcu/login'

export function dodge() {
  return lcm.lcuRequest({
    method: 'POST',
    url: '/lol-login/v1/session/invoke',
    data: ['', 'teambuilder-draft', 'quitV2', ''],
    params: {
      destination: 'lcdsServiceProxy',
      method: 'call',
      args: '["", "teambuilder-draft", "quitV2", ""]'
    }
  })
}

export function getLoginQueueState() {
  return lcm.lcuRequest<LoginQueueState>({
    url: '/lol-login/v1/login-queue-state',
    method: 'GET'
  })
}
