import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

import { useAppStore } from './store'

export class AppRendererModule extends StateSyncModule {
  constructor() {
    super('app')
  }

  override async setup() {
    await super.setup()

    await this._migrateFromLocalStorage()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useAppStore()

    this.simpleSync(
      'settings/show-free-software-declaration',
      (s) => (store.settings.showFreeSoftwareDeclaration = s)
    )
    this.simpleSync('settings/close-strategy', (s) => (store.settings.closeStrategy = s))
    this.simpleSync('settings/use-wmic', (s) => (store.settings.useWmic = s))
    this.simpleSync('settings/is-in-kyoko-mode', (s) => (store.settings.isInKyokoMode = s))
    this.simpleSync('is-administrator', (s) => (store.isAdministrator = s))

    this.getAppVersion().then((v) => (store.version = v))
  }

  getAppVersion() {
    return this.call('get-app-version')
  }

  setShowFreeSoftwareDeclaration(value: boolean) {
    return this.call('set-setting/show-free-software-declaration', value)
  }

  setCloseStrategy(value: string) {
    return this.call('set-setting/close-strategy', value)
  }

  setUseWmic(value: boolean) {
    return this.call('set-setting/use-wmic', value)
  }

  setInKyokoMode(value: boolean) {
    return this.call('set-setting/is-in-kyoko-mode', value)
  }

  private async _migrateFromLocalStorage() {
    const all: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const item = localStorage.getItem(key)
        if (item) {
          all[key] = item
        }
      }
    }

    if (Object.keys(all).length === 0) {
      return
    }

    try {
      const ok = await this.call('migrate-settings-from-legacy-version', all)

      if (ok) {
        localStorage.clear()
      }
    } catch {}
  }

  openUserDataDirInExplorer() {
    return this.call('open-in-explorer/user-data')
  }

  openLogsDirInExplorer() {
    return this.call('open-in-explorer/logs')
  }

  private _stringifyError(data: any) {
    if (data instanceof Error) {
      return {
        message: data.message,
        stack: data.stack,
        name: data.name
      }
    }

    return data
  }

  get logger() {
    return {
      info: async (message: string, data?: any) => {
        console.info(`\x1b[32m[info]\x1b[0m ${message}`, data)
        await this.call('renderer-log', 'info', message, this._stringifyError(data))
      },
      warn: async (message: string, data?: any) => {
        console.warn(`\x1b[33m[warn]\x1b[0m ${message}`, data)
        await this.call('renderer-log', 'warn', message, this._stringifyError(data))
      },
      error: async (message: string, data?: any) => {
        console.error(`\x1b[31m[error]\x1b[0m ${message}`, data)
        await this.call('renderer-log', 'error', message, this._stringifyError(data))
      },
      debug: async (message: string, data?: any) => {
        console.debug(`\x1b[34m[debug]\x1b[0m ${message}`, data)
        await this.call('renderer-log', 'debug', message, this._stringifyError(data))
      }
    }
  }
}

export const appRendererModule = new AppRendererModule()
