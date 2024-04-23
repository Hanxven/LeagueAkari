import { GameflowPhase } from '@shared/types/lcu/gameflow'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameflowStore = defineStore('lcu:gameflow', () => {
  const phase = ref<GameflowPhase>(null)

  return {
    phase
  }
})
