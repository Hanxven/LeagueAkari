import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useRespawnTimerStore = defineStore('module:respawn-timer', () => {
  const timeLeft = ref(0)
  const totalTime = ref(0)
  const isDead = ref(false)

  const settings = reactive({
    enabled: false
  })

  return {
    isDead,
    timeLeft,
    totalTime,
    settings
  }
})
