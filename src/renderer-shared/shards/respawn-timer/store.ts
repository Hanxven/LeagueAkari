import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useRespawnTimerStore = defineStore('shard:respawn-timer-renderer', () => {
  const settings = shallowReactive({
    enabled: false
  })

  const info = shallowRef({
    timeLeft: 0,
    totalTime: 0,
    isDead: false
  })

  return {
    settings,

    info
  }
})
