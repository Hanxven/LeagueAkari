import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useAutoReplyStore = defineStore('feature:auto-reply', () => {
  const settings = reactive({
    enabled: false,
    enableOnAway: false,
    text: ''
  })

  return {
    settings
  }
})
