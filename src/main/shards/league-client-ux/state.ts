import { UxCommandLine } from '@main/utils/ux-cmd'
import { makeAutoObservable, observable } from 'mobx'

class LeagueClientUxSettings {
  useWmic = false

  constructor() {
    makeAutoObservable(this)
  }

  setUseWmic(s: boolean) {
    this.useWmic = s
  }
}

export class LeagueClientUxState {
  settings = new LeagueClientUxSettings()

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
