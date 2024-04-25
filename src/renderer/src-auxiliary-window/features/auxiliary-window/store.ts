import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuxiliaryWindowStore = defineStore('feature:auxiliary-window', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const isShow = ref(false)
  const isPinned = ref(false)

  return {
    windowState,
    focusState,
    isShow,
    isPinned
  }
})
