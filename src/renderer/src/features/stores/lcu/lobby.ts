import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import { AvailableBot, Lobby } from '@shared/types/lcu/lobby'

export const id = 'store:lobby'

export const useLobbyStore = defineStore('lobby', () => {
  const lobby = shallowRef<Lobby | null>(null)

  return {
    lobby
  }
})
