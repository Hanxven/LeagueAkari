import { request } from './common'

export function updatePlayerPreferences(config: object) {
  return request<void>({
    method: 'POST',
    url: 'lol-challenges/v1/update-player-preferences',
    data: config
  })
}
