import { Mission } from '@shared/types/league-client/missions'
import { AxiosInstance } from 'axios'

export class MissionsHttpApi {
  constructor(private _http: AxiosInstance) {}

  putPlayer(missionIds: string[]) {
    return this._http.put<void>('/lol-missions/v1/player', {
      missionIds
    })
  }

  putRewardGroups(id: string, rewardGroups: string[]) {
    return this._http.put<void>(`/lol-missions/v1/player/${id}/reward-groups`, { rewardGroups })
  }

  getMissions() {
    return this._http.get<Mission[]>('/lol-missions/v1/missions')
  }
}
