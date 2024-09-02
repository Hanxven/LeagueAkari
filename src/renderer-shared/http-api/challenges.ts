import { request } from './common'

export function updatePlayerPreferences(config: object) {
  return request<void>({
    method: 'POST',
    url: '/lol-challenges/v1/update-player-preferences/', // 至于为什么这里有一个 trailing slash, 我也不知道
    data: config
  })
}
