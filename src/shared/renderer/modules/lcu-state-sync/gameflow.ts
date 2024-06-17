import { GameflowPhase, GameflowSession } from '@shared/types/lcu/gameflow'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameflowStore = defineStore('lcu:gameflow', () => {
  const phase = ref<GameflowPhase | null>(null)
  const session = ref<GameflowSession | null>(null)

  return {
    phase,
    session
  }
})
