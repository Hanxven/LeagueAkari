import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'

export function restartUx() {
  return lcm.lcuRequest({
    url: '/riotclient/kill-and-restart-ux',
    method: 'POST'
  })
}

// 有时候你可以暂时关闭它，以节省资源
export function killUx() {
  return lcm.lcuRequest({
    url: '/riotclient/kill-ux',
    method: 'POST'
  })
}

export function launchUx() {
  return lcm.lcuRequest({
    url: '/riotclient/launch-ux',
    method: 'POST'
  })
}
