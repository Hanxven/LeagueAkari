import { request } from './common'

// 客户端似乎并未实装
export function restart() {
  return request({
    url: '/process-control/v1/process/restart?delaySeconds=&restartVersion=',
    method: 'POST'
  })
}

export function quit() {
  return request({
    url: '/process-control/v1/process/quit',
    method: 'POST'
  })
}
