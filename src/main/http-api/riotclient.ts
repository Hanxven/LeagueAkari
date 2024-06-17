import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'

export function restartUx() {
  return lcm.request({
    url: '/riotclient/kill-and-restart-ux',
    method: 'POST'
  })
}

// 有时候你可以暂时关闭它，以节省资源
export function killUx() {
  return lcm.request({
    url: '/riotclient/kill-ux',
    method: 'POST'
  })
}

export function launchUx() {
  return lcm.request({
    url: '/riotclient/launch-ux',
    method: 'POST'
  })
}
