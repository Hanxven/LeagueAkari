import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import { ChampSelectSession } from '@renderer/types/champ-select'

export const useChampSelectStore = defineStore('champ-select', () => {
  const session = shallowRef<ChampSelectSession | null>(null)
  const currentPickableChampions = shallowRef(new Set<number>())

  return {
    session,
    currentPickableChampions
  }
})
