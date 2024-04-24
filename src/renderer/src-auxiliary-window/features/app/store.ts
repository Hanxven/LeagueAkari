import { defineStore } from 'pinia'
import { ref } from 'vue'

export type LcuConnectionState = 'connecting' | 'connected' | 'disconnected'

export interface LcuAuth {
  port: number
  pid: number
  password: string
  certificate: string
  rsoPlatformId: string
  region: string
}

export const useAppStore = defineStore('core:app', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const isShow = ref(false)
  const isPinned = ref(false)

  const lcuConnectionState = ref<LcuConnectionState>('connecting')
  const lcuAuth = ref<LcuAuth | null>(null)

  return {
    windowState,
    focusState,
    lcuAuth,
    lcuConnectionState,
    isShow,
    isPinned
  }
})
