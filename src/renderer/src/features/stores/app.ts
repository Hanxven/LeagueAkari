import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useAppState = defineStore('windowState', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const isAdmin = ref(false)
  const version = ref('0.0.0')
  const newUpdate = shallowRef<{
    currentVersion: string
    version: string
    pageUrl: string
    downloadUrl: string
    description: string
  } | null>(null)
  const isCheckingUpdates = ref(false)

  return {
    windowState,
    isAdmin,
    focusState,
    version,
    newUpdate,
    isCheckingUpdates
  }
})
