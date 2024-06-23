import { defineStore } from 'pinia'
import { reactive, ref, shallowRef } from 'vue'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

// copied from main module
interface UpdateProgressInfo {
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart'

  downloadingProgress: number

  averageDownloadSpeed: number

  downloadTimeLeft: number

  fileSize: number

  unpackingProgress: number
}

export const useAutoUpdateStore = defineStore('module:auto-update', () => {
  const settings = reactive({
    autoCheckUpdates: true,
    autoDownloadUpdates: true,
    downloadSource: 'gitee'
  })

  const isCheckingUpdates = ref(false)
  const newUpdates = shallowRef<NewUpdates | null>(null)
  const lastCheckAt = ref<Date | null>(null)
  const updateProgressInfo = shallowRef<UpdateProgressInfo | null>(null)

  return {
    settings,
    newUpdates,
    isCheckingUpdates,
    lastCheckAt,
    updateProgressInfo
  }
})
