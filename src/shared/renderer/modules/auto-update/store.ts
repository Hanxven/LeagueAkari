import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

export const useAutoUpdateStore = defineStore('module:auto-update', () => {
  const settings = reactive({
    autoCheckUpdates: true,
    autoDownloadUpdates: true
  })

  const isCheckingUpdates = ref(false)
  const newUpdates = ref<NewUpdates | null>(null)

  return {
    settings,
    newUpdates,
    isCheckingUpdates
  }
})
