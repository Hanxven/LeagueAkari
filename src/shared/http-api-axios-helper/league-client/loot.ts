import { LootCraftResponse, LootMap } from '@shared/types/league-client/loot'
import { AxiosInstance } from 'axios'

export class LootHttpApi {
  constructor(private _http: AxiosInstance) {}

  getLootMap() {
    return this._http.get<LootMap>('/lol-loot/v1/player-loot-map')
  }

  craftLoot(loot: string, repeat = 1) {
    return this._http.post<LootCraftResponse>(`/lol-loot/v1/recipes/${loot}/craft?repeat=${repeat}`)
  }
}
