import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainWindowStore = defineStore('module:main-window', () => {
  const windowState = ref('normal')
  const focusState = ref('blurred')

  return {
    windowState,
    focusState
  }
})
