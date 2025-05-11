import { makeAutoObservable, observable } from 'mobx'

// TODO -> migration needed
export interface SendableItemContentPlaintext {
  type: 'plaintext'
  content: string
}

export interface SendableItemContentTemplate {
  type: 'template'
  templateId: string | null // sometimes it may refer to an invalid template
}

export type SendableItemContent = SendableItemContentPlaintext | SendableItemContentTemplate

export interface SendableItem {
  id: string
  name: string
  enabled: boolean

  /**
   * 通用快捷键, 或发送到全局
   */
  sendAllShortcut: string | null

  /**
   * 发送到己方
   */
  sendAllyShortcut: string | null

  /**
   * 发送到敌方
   */
  sendEnemyShortcut: string | null

  /**
   * 内容
   */
  content: SendableItemContent
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
  sendableItems: SendableItem[] = []
  templates: TemplateDef[] = []

  cancelShortcut: string | null = null
  sendInterval: number = 65

  setCancelShortcut(shortcut: string | null) {
    this.cancelShortcut = shortcut
  }

  setSendableItems(customSend: SendableItem[]) {
    this.sendableItems = customSend
  }

  setSendInterval(interval: number) {
    this.sendInterval = interval
  }

  constructor() {
    makeAutoObservable(this, {
      sendableItems: observable.ref,
      templates: observable.ref
    })
  }
}

export class InGameSendState {
  constructor() {
    makeAutoObservable(this, {})
  }
}
