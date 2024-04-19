import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useAutoHonorStore = defineStore('feature:auto-honor', () => {
  const settings = reactive({
    enabled: false,
    strategy: 'prefer-lobby-member'
  })

  return {
    settings
  }
})
