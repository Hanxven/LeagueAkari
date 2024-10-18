import { makeAutoObservable, observable } from 'mobx'

interface CustomSend {
  enabled: boolean
  shortcut: string | null
  message: string
}

export class InGameSendSettings {
  customSend: CustomSend[] = []

  sendKdaShortcut: string | null = null

  constructor() {
    makeAutoObservable(this, {
      customSend: observable.ref
    })
  }
}

export class InGameSendState {
  constructor() {
    makeAutoObservable(this)
  }
}
