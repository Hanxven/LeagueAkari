import { makeAutoObservable, observable } from 'mobx'

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

interface CurrentAnnouncement {
  content: string
  updateAt: Date
  isRead: boolean
  md5: string
}

interface UpdateProgressInfo {
  /**
   * 当前更新阶段
   */
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart' | 'download-failed' | 'unpack-failed'

  /**
   * 当前下载进度，0 到 1
   */
  downloadingProgress: number

  /**
   * 平均下载速度，单位 B/s
   */
  averageDownloadSpeed: number

  /**
   * 剩余下载时间，单位秒
   */
  downloadTimeLeft: number

  /**
   * 更新包大小
   */
  fileSize: number

  /**
   * 解压进度，0 到 1
   */
  unpackingProgress: number
}

interface LastUpdateResult {
  success: boolean
  reason: string
  newVersionPageUrl: string
}

export class SelfUpdateSettings {
  /**
   * 是否自动检查更新，检查到更新才会下载更新
   */
  autoCheckUpdates: boolean = true

  /**
   * 是否自动下载更新
   */
  autoDownloadUpdates: boolean = true

  /**
   * 下载源
   */
  downloadSource: 'gitee' | 'github' = 'gitee'

  constructor() {
    makeAutoObservable(this)
  }

  setAutoCheckUpdates(autoCheckUpdates: boolean) {
    this.autoCheckUpdates = autoCheckUpdates
  }

  setAutoDownloadUpdates(autoDownloadUpdates: boolean) {
    this.autoDownloadUpdates = autoDownloadUpdates
  }

  setDownloadSource(downloadSource: 'gitee' | 'github') {
    this.downloadSource = downloadSource
  }
}

export class SelfUpdateState {
  isCheckingUpdates: boolean = false
  lastCheckAt: Date | null = null
  currentReleaseV = observable.box<CurrentRelease | null>(null, {
    equals: SelfUpdateState._versionCompare
  })

  get currentRelease() {
    return this.currentReleaseV.get()
  }

  updateProgressInfo: UpdateProgressInfo | null = null

  currentAnnouncement: CurrentAnnouncement | null

  lastUpdateResult: LastUpdateResult | null = null

  private static _versionCompare(a: CurrentRelease, b: CurrentRelease) {
    if (a === null && b === null) {
      return true
    }

    if (a === null || b === null) {
      return false
    }

    if (a.isNew !== b.isNew) {
      return false
    }

    return a.currentVersion === b.currentVersion && a.releaseVersion === b.releaseVersion
  }

  constructor() {
    makeAutoObservable(this, {
      updateProgressInfo: observable.ref,
      currentAnnouncement: observable.ref,
      lastUpdateResult: observable.ref
    })
  }

  setCheckingUpdates(isCheckingUpdates: boolean) {
    this.isCheckingUpdates = isCheckingUpdates
  }

  setCurrentRelease(updates: CurrentRelease | null) {
    this.currentReleaseV.set(updates)
  }

  setCurrentAnnouncement(announcement: CurrentAnnouncement | null) {
    this.currentAnnouncement = announcement
  }

  setAnnouncementRead(isRead: boolean) {
    if (this.currentAnnouncement) {
      this.currentAnnouncement = {
        ...this.currentAnnouncement,
        isRead
      }
    }
  }

  setUpdateProgressInfo(info: UpdateProgressInfo | null) {
    this.updateProgressInfo = info
  }

  setLastCheckAt(date: Date) {
    this.lastCheckAt = date
  }

  setLastUpdateResult(result: LastUpdateResult) {
    this.lastUpdateResult = result
  }
}
