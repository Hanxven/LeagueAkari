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

  getPlayerAccountAlias(gameName: string, tagLine?: string) {
    return this._http.get<PlayerAccountAlias[]>('/player-account/aliases/v1/lookup', {
      params: { gameName, tagLine }
    })
  }

  getPlayerAccountNameset(puuids: string[]) {
    return this._http.post<PlayerAccountNameset>('/player-account/lookup/v1/namesets-for-puuids', {
      puuids
    })
  }
}
