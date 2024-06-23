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
    this.simpleSync('last-check-at', (s) => (store.lastCheckAt = s))
    this.simpleSync('update-progress-info', (s) => (store.updateProgressInfo = s))
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

  test() {
    return this.call('test-update')
  }
}

export const autoUpdateRendererModule = new AutoUpdateRendererModule()
