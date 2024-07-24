import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'

// 客户端似乎并未实装
export function restart() {
  return lcm.lcuRequest({
    url: '/process-control/v1/process/restart?delaySeconds=&restartVersion=',
    method: 'POST'
  })
}

export function quit() {
  return lcm.lcuRequest({
    url: '/process-control/v1/process/quit',
    method: 'POST'
  })
}
