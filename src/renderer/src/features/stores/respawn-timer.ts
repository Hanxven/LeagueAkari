import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRespawnTimerStore = defineStore('feature:respawn-timer', () => {
  // 即将自动接受对局
  const timeLeft = ref(0)
  const isDead = ref(false)

  return {
    isDead,
    timeLeft
  }
})
