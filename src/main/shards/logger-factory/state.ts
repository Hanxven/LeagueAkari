import { makeAutoObservable } from 'mobx'

export class LoggerFactoryState {
  logLevel: string = 'info'

  setLogLevel(level: string) {
    this.logLevel = level
  }

  constructor() {
    makeAutoObservable(this)
  }
}
