import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAuxiliaryWindowStore = defineStore('module:auxiliary-window', () => {
  const windowState = 'normal'
  const focusState = 'focused'
  const currentFunctionality = 'indicator'
  const isShow = ref(false)

  const settings = reactive({
    opacity: 1,
    enabled: true,
    showSkinSelector: true,
    zoomFactor: 1.0,
    isPinned: true
  })

  return {
    windowState,
    focusState,
    isShow,
    currentFunctionality,
    settings
  }
})
