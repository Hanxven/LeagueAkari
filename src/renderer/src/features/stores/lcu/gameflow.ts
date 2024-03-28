import { defineStore } from 'pinia'
import { ref } from 'vue'

import { GameflowPhase } from '@shared/types/lcu/gameflow'

// v1 store
export const useGameflowStore = defineStore('gameflow', () => {
  const phase = ref<GameflowPhase>(null)

  return {
    phase
  }
})
