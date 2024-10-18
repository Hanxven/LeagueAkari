import { makeAutoObservable } from 'mobx'

export type MainWindowCloseStrategy = 'minimize-to-tray' | 'quit' | 'unset'

export class AppCommonSettings {
  mainWindowCloseStrategy: MainWindowCloseStrategy

  constructor() {
    makeAutoObservable(this)
  }
}

export class AppCommonState {
  public readonly settings = new AppCommonSettings()

  isAdministrator: boolean = false

  setAdministrator(s: boolean) {
    this.isAdministrator = s
  }

  constructor() {
    makeAutoObservable(this)
  }
}
