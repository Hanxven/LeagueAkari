import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

// copied from main shard
export interface SendableItemContentPlaintext {
  type: 'plaintext'
  content: string
}

export interface SendableItemContentTemplate {
  type: 'template'
  templateId: string | null
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

export const useInGameSendStore = defineStore('shard:in-game-send-renderer', () => {
  const settings = shallowReactive({
    sendableItems: [] as SendableItem[],
    templates: [] as TemplateDef[],
    cancelShortcut: null as string | null,
    sendInterval: 65
  })

  return {
    settings
  }
})
