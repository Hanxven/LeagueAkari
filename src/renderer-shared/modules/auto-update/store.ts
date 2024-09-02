import { defineStore } from 'pinia'
import { reactive, ref, shallowRef } from 'vue'

// copied from main module
interface NewUpdates {
  source: 'gitee' | 'github'
  currentVersion: string
  releaseVersion: string
  releaseNotesUrl: string
  downloadUrl: string
  releaseNotes: string
  filename: string
}

interface CurrentAnnouncement {
  content: string
  updateAt: Date
  sha: string
  isRead: boolean
}

// copied from main module
interface UpdateProgressInfo {
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart' | 'download-failed' | 'unpack-failed'

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
  const currentAnnouncement = shallowRef<CurrentAnnouncement | null>(null)

  return {
    settings,
    newUpdates,
    isCheckingUpdates,
    updateProgressInfo,
    lastCheckAt,
    currentAnnouncement
  }
})
