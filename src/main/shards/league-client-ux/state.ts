import { UxCommandLine } from '@main/utils/ux-cmd'
import { makeAutoObservable, observable } from 'mobx'

export class LeagueClientUxSettings {
  useWmic = false

  constructor() {
    makeAutoObservable(this)
  }

  setUseWmic(s: boolean) {
    this.useWmic = s
  }
}

export class LeagueClientUxState {
  launchedClients: UxCommandLine[] = []

  constructor() {
    makeAutoObservable(this, {
      launchedClients: observable.struct
    })
  }

  setLaunchedClients(c: UxCommandLine[]) {
    this.launchedClients = c
  }
}
