import { defineStore } from 'pinia'
import { reactive } from 'vue'

export type PrintRules = Record<
  string,
  {
    stopHandle: Function | null
    enabled: boolean
  }
>

// 有关各种功能的设置项
export const useDebugStore = defineStore('module:debug', () => {
  // 调试功能的打印事件
  const settings = reactive({
    printAllLcuEvents: false,
    printRules: {} as PrintRules
  })

  return {
    settings
  }
})
