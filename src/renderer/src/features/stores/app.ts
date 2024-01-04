import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

export const useAppState = defineStore('windowState', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const isAdmin = ref(false)
  const version = ref('0.0.0')
  const updates = ref({
    isCheckingUpdates: false,
    lastCheckAt: null as Date | null,
    newUpdates: null as NewUpdates | null
  })

  return {
    windowState,
    isAdmin,
    focusState,
    version,
    updates
  }
})
