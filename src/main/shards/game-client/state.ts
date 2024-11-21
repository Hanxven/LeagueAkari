import { makeAutoObservable } from 'mobx'

export class GameClientSettings {
  terminateGameClientWithShortcut = false
  terminateShortcut: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  setTerminateGameClientWithShortcut(value: boolean) {
    this.terminateGameClientWithShortcut = value
  }

  setTerminateShortcut(shortcut: string | null) {
    this.terminateShortcut = shortcut
  }
}
