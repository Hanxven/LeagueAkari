import { request } from './common'

export interface PlayerAccountAlias {
  alias: Alias
  puuid: string
}

interface Alias {
  game_name: string
  tag_line: string
}

export interface PlayerAccountNameset {
  namesets: Nameset[]
}

interface Nameset {
  error: string
  gnt: {
    gameName: string
    shadowGnt: boolean
    tagLine: string
  }
  playstationNameset: {
    name: string
  }
  providerId: string
  puuid: string
  switchNameset: {
    name: string
  }
  xboxNameset: {
    name: string
  }
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

  if (result.data.length === 0) {
    throw new Error('No player found')
  }

  return result.data[0]
}

export async function getPlayerAccountNameset(puuid: string) {
  const result = await request<PlayerAccountNameset>({
    url: '/player-account/lookup/v1/namesets-for-puuids',
    method: 'POST',
    data: {
      puuids: [puuid]
    }
  })

  if (result.data.namesets.length === 0) {
    throw new Error('No player found')
  }

  return result.data.namesets[0]
}
