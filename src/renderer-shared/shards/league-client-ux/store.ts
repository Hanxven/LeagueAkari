import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

import { UxCommandLine } from '../league-client/store'

export const useLeagueClientUxStore = defineStore('shard:league-client-ux-renderer', () => {
  const settings = shallowReactive({
    useWmic: false
  })

  const launchedClients = shallowRef<UxCommandLine[]>([])

  return {
    settings,
    launchedClients
  }
})
