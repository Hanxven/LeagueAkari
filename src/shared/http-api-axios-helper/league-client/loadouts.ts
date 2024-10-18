import { AccountScopeLoadouts } from '@shared/types/league-client/game-data'
import { AxiosInstance } from 'axios'

/**
 * 下一次的模式开放, 涉及到 STRAWBERRY 估计 API 会有很大变动
 */
export class LoadoutsHttpApi {
  constructor(private _http: AxiosInstance) {}

  setStrawberryDifficulty(contentId: string, difficulty: number) {
    return this._http.patch(`/lol-loadouts/v4/loadouts/${contentId}`, {
      loadout: {
        STRAWBERRY_DIFFICULTY: { inventoryType: 'STRAWBERRY_LOADOUT_ITEM', itemId: difficulty }
      }
    })
  }

  getAccountScopeLoadouts() {
    return this._http.get<AccountScopeLoadouts[]>('/lol-loadouts/v4/loadouts/scope/account')
  }
}
