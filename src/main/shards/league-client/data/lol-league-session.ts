import { makeAutoObservable, observable } from 'mobx'

export class LolLeagueSessionState {
  token: string | null = null

  setToken(t: string | null) {
    this.token = t
  }

  constructor() {
    makeAutoObservable(this)
  }
}
