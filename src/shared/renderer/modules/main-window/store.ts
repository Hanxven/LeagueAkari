import { defineStore } from 'pinia'
import { VNode, ref } from 'vue'

export interface TitleBarTask {
  id: string // module id
  progress?: number // from 0 ~ 1
  foregroundColor?: string
  backgroundColor?: string
  text?: string | (() => VNode)
  icon?: () => VNode
}

export const useMainWindowStore = defineStore('module:main-window', () => {
  const windowState = 'normal'
  const focusState = 'focused'

  const titleBarTasks = ref<TitleBarTask[]>([])

  return {
    windowState,
    focusState,
    titleBarTasks
  }
})
