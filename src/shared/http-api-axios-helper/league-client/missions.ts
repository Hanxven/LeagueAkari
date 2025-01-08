import { Mission, MissionData, MissionSeries } from '@shared/types/league-client/missions'
import { AxiosInstance } from 'axios'

export class MissionsHttpApi {
  constructor(private _http: AxiosInstance) {}

  putPlayer(missionIds: string[], seriesIds: string[] = []) {
    return this._http.put<void>('/lol-missions/v1/player', {
      missionIds,
      seriesIds: seriesIds.length ? seriesIds : undefined
    })
  }

  putRewardGroups(id: string, rewardGroups: string[]) {
    return this._http.put<void>(`/lol-missions/v1/player/${id}/reward-groups`, { rewardGroups })
  }

  getMissions() {
    return this._http.get<Mission[]>('/lol-missions/v1/missions')
  }

  getSeries() {
    return this._http.get<MissionSeries[]>('/lol-missions/v1/series')
  }

  getData() {
    return this._http.get<MissionData>('/lol-missions/v1/data')
  }
}
