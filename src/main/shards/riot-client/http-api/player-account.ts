import { AxiosInstance } from 'axios'

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

export class PlayerAccountHttpApi {
  constructor(private _http: AxiosInstance) {}

  async getPlayerAccountAlias(gameName: string, tagLine: string) {
    const { data } = await this._http.get<PlayerAccountAlias[]>(
      '/player-account/aliases/v1/lookup',
      {
        params: {
          gameName,
          tagLine
        }
      }
    )

    if (data.length === 0) {
      throw new Error('No player found')
    }

    return data[0]
  }

  async getPlayerAccountNameset(puuid: string) {
    const { data } = await this._http.post<PlayerAccountNameset>(
      '/player-account/lookup/v1/namesets-for-puuids',
      {
        puuids: [puuid]
      }
    )

    if (data.namesets.length === 0) {
      throw new Error('No player found')
    }

    return data.namesets[0]
  }
}
