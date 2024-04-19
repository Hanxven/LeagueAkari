import { Lobby } from '@shared/types/lcu/lobby'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const id = 'store:lobby'

export const useLobbyStore = defineStore('lobby', () => {
  const lobby = shallowRef<Lobby | null>(null)

  return {
    lobby
  }
})
