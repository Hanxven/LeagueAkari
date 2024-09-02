import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useLeagueClientStore = defineStore('module:league-client', () => {
  const settings = reactive({
    fixWindowMethodAOptions: {
      baseWidth: 1600,
      baseHeight: 900
    },
    terminateGameClientOnAltF4: false
  })

  return {
    settings
  }
})
