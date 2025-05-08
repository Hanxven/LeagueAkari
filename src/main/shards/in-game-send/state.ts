import { makeAutoObservable, observable } from 'mobx'

export interface CustomSend {
  id: string
  name: string
  enabled: boolean
  message: string
  shortcut: string | null
  textSource: 'plaintext' | 'template'
  templateId: string | null
}

export interface TemplateDef {
  id: string
  name: string
  code: string
  isValid: boolean
  type: string
  error: string | null
}

export class InGameSendSettings {
  customSend: CustomSend[] = []
  sendStatsEnabled: boolean = false
  sendStatsTemplate = {
    template: '',
    isValid: false
  }

  cancelShortcut: string | null = null
  sendInterval: number = 65

  // experimental feature
  templates: TemplateDef[] = []

  setSendStatsEnabled(enabled: boolean) {
    this.sendStatsEnabled = enabled
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
