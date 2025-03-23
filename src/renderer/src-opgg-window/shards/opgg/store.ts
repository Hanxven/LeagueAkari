import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useOpggStore = defineStore('shard:opgg-renderer', () => {
  const frontendSettings = shallowReactive({
    autoApply: false,
    autoApplyRunes: false,
    autoApplyItems: false,
    autoApplySpells: false
  })

  return {
    frontendSettings
  }
})
