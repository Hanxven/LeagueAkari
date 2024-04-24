import { request } from './common'

export function restartUx() {
  return request({
    url: '/riotclient/kill-and-restart-ux',
    method: 'POST'
  })
}

// 有时候你可以暂时关闭它，以节省资源
export function killUx() {
  return request({
    url: '/riotclient/kill-ux',
    method: 'POST'
  })
}

export function launchUx() {
  return request({
    url: '/riotclient/launch-ux',
    method: 'POST'
  })
}
