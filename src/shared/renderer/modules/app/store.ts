import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { defineStore } from 'pinia'
import { VNode, reactive, ref } from 'vue'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

export interface TitleBarTask {
  id: string // module id
  progress?: number // from 0 ~ 1
  foregroundColor?: string
  backgroundColor?: string
  text?: string | (() => VNode)
  icon?: () => VNode
}

export const useAppStore = defineStore('core:app', () => {
  const isAdministrator = ref(false)
  const version = ref('0.0.0')
  const settings = reactive({
    useWmic: false,
    showFreeSoftwareDeclaration: false,
    closeStrategy: 'unset' as MainWindowCloseStrategy,
    isInKyokoMode: false
  })

  const titleBarTasks = ref<TitleBarTask[]>([])

  return {
    isAdministrator,
    version,
    settings,
    titleBarTasks
  }
})
