import { makeAutoObservable } from 'mobx'

export class GameClientSettings {
  terminateGameClientOnAltF4 = true

  constructor() {
    makeAutoObservable(this)
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    this.terminateGameClientOnAltF4 = value
  }
}
