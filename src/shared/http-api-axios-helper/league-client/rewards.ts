import { RewardsGrant, RewardsGroup } from '@shared/types/league-client/rewards'
import { AxiosInstance } from 'axios'

export interface PostGrantSelectionDto {
  grantId: string
  selections: string[]
  rewardGroupId: string
  selection?: string
}

// not sure what this is for
// further investigation needed
export interface PostCelebrationsFscDto {
  fsc?: any
  id: string
  canvas?: any
  media?: any
  rewards?: any
}

export class RewardsHttpApi {
  constructor(private _http: AxiosInstance) {}

  postCelebrationsFsc(data: PostCelebrationsFscDto) {
    return this._http.post('/lol-rewards/v1/celebrations/fsc', data)
  }

  getGrants(status?: string) {
    return this._http.get<RewardsGrant[]>('/lol-rewards/v1/grants', {
      params: {
        status
      }
    })
  }

  patchGrantsView(data: any) {
    return this._http.patch('/lol-rewards/v1/grants/view', data)
  }

  postGrantSelection(grantId: string, data: PostGrantSelectionDto) {
    return this._http.post(`/lol-rewards/v1/grants/${grantId}/select`, data)
  }

  // filter it or 50000 lines of json :)
  getGroups(types?: string[]) {
    return this._http.get<RewardsGroup[]>('/lol-rewards/v1/groups', {
      params: {
        types
      }
    })
  }

  postRewardReplay(data: { rewardGroupId: string }) {
    return this._http.post('/lol-rewards/v1/reward/replay', data)
  }

  postSelectBulk(data: { selection: string[] }) {
    return this._http.post('/lol-rewards/v1/select-bulk', data)
  }
}
