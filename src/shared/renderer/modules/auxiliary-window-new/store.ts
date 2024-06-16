import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAuxiliaryWindowStore = defineStore('module:auxiliary-window', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const isShow = ref(false)
  const isPinned = ref(false)

  const settings = reactive({
    opacity: 1,
    enabled: true,
    showSkinSelector: true,
    zoomFactor: 1.0
  })

  return {
    windowState,
    focusState,
    isShow,
    isPinned,
    settings
  }
})
