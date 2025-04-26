import { makeAutoObservable } from 'mobx'

export class LeagueSessionState {
  token: string | null = null

  setToken(t: string | null) {
    this.token = t
  }

  constructor() {
    makeAutoObservable(this)
  }
}
