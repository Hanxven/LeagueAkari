import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'
import { formatError } from '@shared/utils/errors'

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

    this.getAppVersion().then((v) => (store.version = v))

    this.stateSync('state', store)
  }

  getAppVersion() {
    return this.call('get-app-version')
  }

  setShowFreeSoftwareDeclaration(value: boolean) {
    return this.call('set-setting', 'showFreeSoftwareDeclaration', value)
  }

  setCloseStrategy(value: string) {
    return this.call('set-setting', 'closeStrategy', value)
  }

  setUseWmic(value: boolean) {
    return this.call('set-setting', 'useWmic', value)
  }

  setInKyokoMode(value: boolean) {
    return this.call('set-setting', 'isInKyokoMode', value)
  }

  setDisableHardwareAcceleration(value: boolean) {
    return this.call('base-config/disable-hardware-acceleration', value)
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
    return formatError(data)
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
