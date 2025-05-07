import { makeAutoObservable, observable } from 'mobx'

export interface CustomSend {
  id: string
  name: string
  enabled: boolean
  message: string
  shortcut: string | null
}

export interface TemplateDef {
  id: string
  name: string
  code: string
  isValid: boolean
}

export class InGameSendSettings {
  customSend: CustomSend[] = []

  sendStatsEnabled: boolean = false
  sendStatsTemplate = {
    template: '',
    isValid: false
  }
  sendStatsUseDefaultTemplate = true
  sendAllyShortcut: string | null = null
  sendEnemyShortcut: string | null = null
  sendAllAlliesShortcut: string | null = null
  sendAllEnemiesShortcut: string | null = null
  cancelShortcut: string | null = null

  sendInterval: number = 65

  // experimental feature
  templates: TemplateDef[] = []

  setSendStatsEnabled(enabled: boolean) {
    this.sendStatsEnabled = enabled
  }

  setSendStatsUseDefaultTemplate(useDefault: boolean) {
    this.sendStatsUseDefaultTemplate = useDefault
  }

  setSendAllyShortcut(shortcut: string | null) {
    this.sendAllyShortcut = shortcut
  }

  setSendEnemyShortcut(shortcut: string | null) {
    this.sendEnemyShortcut = shortcut
  }

  setSendAllAlliesShortcut(shortcut: string | null) {
    this.sendAllAlliesShortcut = shortcut
  }

  setSendAllEnemiesShortcut(shortcut: string | null) {
    this.sendAllEnemiesShortcut = shortcut
  }

  setSendStatsTemplate(template: string, valid: boolean) {
    this.sendStatsTemplate = {
      template,
      isValid: valid
    }
  }

  setCustomSend(customSend: CustomSend[]) {
    this.customSend = customSend
  }

  setSendInterval(interval: number) {
    this.sendInterval = interval
  }

  constructor() {
    makeAutoObservable(this, {
      customSend: observable.ref,
      sendStatsTemplate: observable.ref,
      templates: observable.ref
    })
  }
}

export class InGameSendState {
  constructor() {
    makeAutoObservable(this)
  }
}
