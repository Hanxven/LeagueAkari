import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

// copied from main shard
interface UpdateProgressInfo {
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart' | 'download-failed' | 'unpack-failed'

  downloadingProgress: number

  averageDownloadSpeed: number

  downloadTimeLeft: number

  fileSize: number

  unpackingProgress: number
}

// copied from main shard
interface CurrentAnnouncement {
  content: string
  updateAt: Date
  isRead: boolean
  md5: string
}

// copied from main shard
interface CurrentRelease {
  isNew: boolean
  source: 'gitee' | 'github'
  currentVersion: string
  releaseVersion: string
  releaseNotesUrl: string
  downloadUrl: string
  filename: string
  releaseNotes: string
}

// copied from main shard
interface LastUpdateResult {
  success: boolean
  reason: string
  newVersionPageUrl: string
}

export const useSelfUpdateStore = defineStore('shard:self-update-renderer', () => {
  const settings = shallowReactive({
    autoCheckUpdates: true,
    autoDownloadUpdates: true,
    downloadSource: 'gitee' as 'gitee' | 'github'
  })

  const isCheckingUpdates = ref(false)
  const lastCheckAt = ref<Date | null>(null)
  const updateProgressInfo = shallowRef<UpdateProgressInfo | null>(null)
  const currentAnnouncement = shallowRef<CurrentAnnouncement | null>(null)
  const currentRelease = shallowRef<CurrentRelease | null>(null)
  const lastUpdateResult = shallowRef<LastUpdateResult | null>(null)

  return {
    settings,

    isCheckingUpdates,
    lastCheckAt,
    updateProgressInfo,
    currentAnnouncement,
    currentRelease,
    lastUpdateResult
  }
})
