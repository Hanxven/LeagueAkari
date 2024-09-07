import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

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

    this.stateSync('state', store)
  }

  checkUpdates() {
    return this.call('check-updates')
  }

  setAutoCheckUpdates(enabled: boolean) {
    return this.call('set-setting', 'autoCheckUpdates', enabled)
  }

  setAutoDownloadUpdates(enabled: boolean) {
    return this.call('set-setting', 'autoDownloadUpdates', enabled)
  }

  setDownloadSource(source: string) {
    return this.call('set-setting', 'downloadSource', source)
  }

  setReadAnnouncement(sha: string) {
    return this.call('set-read', sha)
  }

  openDownloadDir() {
    return this.call('open-in-explorer/new-updates')
  }
}

export const autoUpdateRendererModule = new AutoUpdateRendererModule()
