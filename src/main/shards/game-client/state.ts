import { makeAutoObservable } from 'mobx'

export class GameClientSettings {
  terminateGameClientOnAltF4 = false

  constructor() {
    makeAutoObservable(this)
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    this.terminateGameClientOnAltF4 = value
  }
}
