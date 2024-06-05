import { Lobby } from '@shared/types/lcu/lobby'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useLobbyStore = defineStore('lcu:lobby', () => {
  const lobby = shallowRef<Lobby | null>(null)

  return {
    lobby
  }
})
