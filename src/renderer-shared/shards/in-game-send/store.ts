import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

// copied from main shard
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
  error: string | null
}

export const useInGameSendStore = defineStore('shard:in-game-send-renderer', () => {
  const settings = shallowReactive({
    customSend: [] as CustomSend[],

    sendStatsEnabled: false,
    sendStatsTemplate: {
      template: '',
      isValid: false
    },
    sendStatsUseDefaultTemplate: true,
    sendAllyShortcut: null as string | null,
    sendEnemyShortcut: null as string | null,
    sendAllAlliesShortcut: null as string | null,
    sendAllEnemiesShortcut: null as string | null,

    cancelShortcut: null as string | null,

    sendInterval: 65,

    templates: [] as TemplateDef[]
  })

  return {
    settings
  }
})
