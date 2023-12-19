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
