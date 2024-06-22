import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { sleep } from '@shared/utils/sleep'
import { makeAutoObservable, observable } from 'mobx'

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

export class AutoUpdateSettings {
  /**
   * 是否自动检查更新，检查到更新才会下载更新
   */
  autoCheckUpdates: boolean = true

  /**
   * 是否自动下载更新
   */
  autoDownloadUpdates: boolean = true

  constructor() {
    makeAutoObservable(this)
  }

  setAutoCheckUpdates(autoCheckUpdates: boolean) {
    this.autoCheckUpdates = autoCheckUpdates
  }

  setAutoDownloadUpdates(autoDownloadUpdates: boolean) {
    this.autoDownloadUpdates = autoDownloadUpdates
  }
}

export class AutoUpdateState {
  settings = new AutoUpdateSettings()

  isCheckingUpdate: boolean = false
  lastCheckAt: Date | null = null
  newUpdates: NewUpdates | null = null

  constructor() {
    makeAutoObservable(this, {
      newUpdates: observable.ref
    })
  }

  setCheckingUpdates(isCheckingUpdates: boolean) {
    this.isCheckingUpdate = isCheckingUpdates
  }

  setLastCheckAt(date: Date) {
    this.lastCheckAt = date
  }

  setNewUpdates(updates: NewUpdates) {
    this.newUpdates = updates
  }
}

export class AutoUpdateModule extends MobxBasedBasicModule {
  public state = new AutoUpdateState()

  constructor() {
    super('auto-update')
  }

  override async setup() {
    await super.setup()

    await this._migrateSettings()
    this._setupSettingsSync()
    this._setupMethodCall()
    this._setupStateSync()
  }

  private async _checkForUpdates() {}

  private async _migrateSettings() {
    // 迁移 app/auto-check-updates 到 auto-update/auto-check-updates
    if (await this._sm.settings.has('app/auto-check-updates')) {
      this._sm.settings.set(
        'auto-update/auto-check-updates',
        await this._sm.settings.get('app/auto-check-updates', true)
      )
      this._sm.settings.remove('app/auto-check-updates')
    }
  }

  private _setupSettingsSync() {
    this.simpleSettingSync(
      'auto-check-updates',
      () => this.state.settings.autoCheckUpdates,
      (s) => this.state.settings.setAutoCheckUpdates(s)
    )

    this.simpleSettingSync(
      'auto-download-updates',
      () => this.state.settings.autoDownloadUpdates,
      (s) => this.state.settings.setAutoDownloadUpdates(s)
    )
  }

  private _setupMethodCall() {
    this.onCall('check-updates', async () => {
      this.state.setCheckingUpdates(true)
      await sleep(1000)
      this.state.setCheckingUpdates(false)
    })
  }

  private _setupStateSync() {
    this.simpleSync('is-checking-updates', () => this.state.isCheckingUpdate)
    this.simpleSync('new-updates', () => this.state.newUpdates)
  }
}

export const autoUpdateModule = new AutoUpdateModule()
