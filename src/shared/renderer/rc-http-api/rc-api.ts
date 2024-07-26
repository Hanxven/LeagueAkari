import { request } from './common'

export interface PlayerAccountAlias {
  alias: Alias
  puuid: string
}

interface Alias {
  game_name: string
  tag_line: string
}

export async function getPlayerAccountAlias(gameName: string, tagLine: string) {
  const result = await request<PlayerAccountAlias[]>({
    url: '/player-account/aliases/v1/lookup',
    method: 'GET',
    params: {
      gameName,
      tagLine
    }
  })

  return result.data[0]
}
