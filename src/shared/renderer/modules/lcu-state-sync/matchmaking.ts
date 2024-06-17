import { GetSearch, ReadyCheck } from '@shared/types/lcu/matchmaking'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useMatchmakingStore = defineStore('lcu:matchmaking', () => {
  const readyCheck = shallowRef<ReadyCheck | null>(null)
  const search = shallowRef<GetSearch | null>()

  return {
    readyCheck,
    search
  }
})
