import { LoginQueueState } from '@shared/types/lcu/login'

import { request } from './common'

export function dodge() {
  return request({
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
  return request<LoginQueueState>({
    url: '/lol-login/v1/login-queue-state',
    method: 'GET'
  })
}
