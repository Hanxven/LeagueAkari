import { Mission, MissionData, MissionSeries } from '@shared/types/league-client/missions'
import { AxiosInstance } from 'axios'

export class MissionsHttpApi {
  constructor(private _http: AxiosInstance) {}

  putPlayer(data?: { seriesIds?: string[]; missionIds?: string[] }) {
    return this._http.put<void>('/lol-missions/v1/player', data)
  }

  // ?
  putRewardGroups(id: string, rewardGroups: string[]) {
    return this._http.put<void>(`/lol-missions/v1/player/${id}/reward-groups`, { rewardGroups })
  }

  putPlayerMission(
    missionId: string,
    data?: {
      rewardGroups?: string[]
    }
  ) {
    return this._http.put<void>(`/lol-missions/v1/player/${missionId}`, data)
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
