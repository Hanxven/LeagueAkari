import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

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
  const isAdministrator = ref(false)
  const version = ref('0.0.0')
  const updates = ref({
    isCheckingUpdates: false,
    lastCheckAt: null as Date | null,
    newUpdates: null as NewUpdates | null
  })

  const lcuConnectionState = ref<LcuConnectionState>('connecting')
  const lcuAuth = ref<LcuAuth | null>(null)

  const settings = reactive({
    autoConnect: false,
    autoCheckUpdates: false,
    showFreeSoftwareDeclaration: false,
    fixWindowMethodAOptions: {
      baseWidth: 1280,
      baseHeight: 720
    }
  })

  return {
    windowState,
    isAdministrator,
    focusState,
    version,
    updates,
    settings,
    lcuAuth,
    lcuConnectionState
  }
})
