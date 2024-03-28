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

export const useLcuStateStore = defineStore('lcu-state', () => {
  const state = ref<LcuConnectionState>('connecting')
  const auth = ref<LcuAuth | null>(null)

  return {
    state,
    auth
  }
})
