import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

import { useAutoUpdateStore } from './store'

export class AutoUpdateRendererModule extends StateSyncModule {
  constructor() {
    super('auto-update')
  }

  override async setup() {
    await super.setup()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useAutoUpdateStore()

    this.simpleSync('settings/auto-check-updates', (s) => (store.settings.autoCheckUpdates = s))
    this.simpleSync(
      'settings/auto-download-updates',
      (s) => (store.settings.autoDownloadUpdates = s)
    )
    this.simpleSync('settings/download-source', (s) => (store.settings.downloadSource = s))
    this.simpleSync('is-checking-updates', (s) => (store.isCheckingUpdates = s))
    this.simpleSync('new-updates', (s) => (store.newUpdates = s))
    this.simpleSync('update-progress-info', (s) => (store.updateProgressInfo = s))
    this.simpleSync('last-check-at', (s) => (store.lastCheckAt = s))
    this.simpleSync('current-announcement', (s) => (store.currentAnnouncement = s))
  }

  checkUpdates() {
    return this.call('check-updates')
  }

  setAutoCheckUpdates(enabled: boolean) {
    return this.call('set-setting/auto-check-updates', enabled)
  }

  setAutoDownloadUpdates(enabled: boolean) {
    return this.call('set-setting/auto-download-updates', enabled)
  }

  setDownloadSource(source: string) {
    return this.call('set-setting/download-source', source)
  }

  setReadAnnouncement(sha: string) {
    return this.call('set-read', sha)
  }

  openDownloadDir() {
    return this.call('open-in-explorer/new-updates')
  }
}

export const autoUpdateRendererModule = new AutoUpdateRendererModule()
