import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppState = defineStore('windowState', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const isAdmin = ref(false)
  const version = ref('0.0.0')

  return {
    windowState,
    isAdmin,
    focusState,
    version
  }
})
