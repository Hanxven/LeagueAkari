import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useGameClientStore = defineStore('shard:game-client-renderer', () => {
  const settings = shallowReactive({
    terminateGameClientOnAltF4: false,
    terminateShortcut: null as string | null
  })

  return {
    settings
  }
})
