import { makeAutoObservable } from 'mobx'

export class GameClientSettings {
  terminateGameClientOnAltF4 = false
  shortcut: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  setTerminateGameClientOnAltF4(value: boolean) {
    this.terminateGameClientOnAltF4 = value
  }

  setShortcut(shortcut: string | null) {
    this.shortcut = shortcut
  }
}
