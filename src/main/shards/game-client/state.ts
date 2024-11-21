import { makeAutoObservable } from 'mobx'

export class GameClientSettings {
  terminateGameClientOnAltF4 = false
  terminateShortcut: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    this.terminateGameClientOnAltF4 = value
  }

  setTerminateShortcut(shortcut: string | null) {
    this.terminateShortcut = shortcut
  }
}
