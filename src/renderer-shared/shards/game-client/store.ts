import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useGameClientStore = defineStore('shard:game-client-renderer', () => {
  const settings = shallowReactive({
    terminateGameClientWithShortcut: false,
    terminateShortcut: null as string | null
  })

  return {
    settings
  }
})
