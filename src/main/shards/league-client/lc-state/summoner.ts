import { SummonerInfo, SummonerProfile } from '@shared/types/league-client/summoner'
import { makeAutoObservable, observable } from 'mobx'

export class SummonerState {
  /**
   * 当前已登录的召唤师。为便于引用，使用 `me` 作为属性名
   */
  me: SummonerInfo | null = null

  profile: SummonerProfile | null = null

  /**
   * 该大区是否启用了新 ID 系统，e.g. `雪之下雪乃#10000`
   */
  newIdSystemEnabled: boolean = false

  constructor() {
    makeAutoObservable(this, { me: observable.struct, profile: observable.struct })
  }

  setMe(value: SummonerInfo | null) {
    this.me = value
  }

  setProfile(value: SummonerProfile | null) {
    this.profile = value
  }

  setNewIdSystemEnabled(enabled: boolean) {
    this.newIdSystemEnabled = enabled
  }
}
