import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoggerStore = defineStore('shard:logger-renderer', () => {
  const logLevel = ref('info')

  return { logLevel }
})
