import { AxiosInstance } from 'axios'

// TODO: Add types
export class RewardTrackHttpApi {
  constructor(private _http: AxiosInstance) {}

  getRegister(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/register/${progressionGroupId}`)
  }

  getBonusItems(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/bonus-items`)
  }

  getBonusProgress(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/bonus-progress`)
  }

  getFailure(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/failure`)
  }

  getItems(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/items`)
  }

  getProgress(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/progress`)
  }

  getUnclaimedRewards(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/unclaimed-rewards`)
  }

  getXp(progressionGroupId: string) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/xp`)
  }
}
