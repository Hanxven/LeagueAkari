import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRendererDebugStore = defineStore('shard:renderer-debug-renderer', () => {
  const sendAllNativeLcuEvents = ref(false)
  const logAllLcuEvents = ref(false)
  const rules = ref<
    {
      rule: string
      enabled: boolean
      stopFn: (() => void) | null
    }[]
  >([])

  return {
    sendAllNativeLcuEvents,
    rules,
    logAllLcuEvents
  }
})
