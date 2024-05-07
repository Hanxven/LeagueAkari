import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAuxiliaryWindowStore = defineStore('feature:auxiliary-window', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const isShow = ref(false)
  const isPinned = ref(false)

  const settings = reactive({
    opacity: 1,
    enabled: true,
    showSkinSelector: true
  })

  return {
    windowState,
    focusState,
    isShow,
    isPinned,
    settings
  }
})
