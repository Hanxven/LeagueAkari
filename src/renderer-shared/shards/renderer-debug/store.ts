import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRendererDebugStore = defineStore('shard:renderer-debug-renderer', () => {
  const sendAllNativeLcuEvents = ref(false)
  const printAll = ref(false)
  const rules = ref<
    {
      rule: string
      enabled: boolean
      stopFn: (() => void) | null
    }[]
  >([])

  return {
    sendAllNativeLcuEvents,
    printAll,
    rules
  }
})
