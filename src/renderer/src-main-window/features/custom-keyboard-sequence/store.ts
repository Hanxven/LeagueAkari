import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useCustomKeyboardSequenceStore = defineStore(
  'feature:custom-keyboard-sequence',
  () => {
    const settings = reactive({
      enabled: false,
      text: ''
    })

    return {
      settings
    }
  }
)
