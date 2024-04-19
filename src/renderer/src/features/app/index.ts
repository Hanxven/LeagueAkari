import { mainCall, mainStateSync } from '@renderer/utils/ipc'

import { useAppStore } from './store'

export const id = 'core:app'

export async function setupApp() {
  const app = useAppStore()

  await migrateFromPreviousLocalStorageSettings()

  mainStateSync('main-window/state', (s) => (app.windowState = s))

  mainStateSync('main-window/focus', (s) => (app.focusState = s))

  mainStateSync('app/is-administrator', (s) => {
    app.isAdministrator = s
  })

  mainStateSync('app/settings/auto-connect', (s) => (app.settings.autoConnect = s))

  mainStateSync('app/settings/auto-check-updates', (s) => (app.settings.autoCheckUpdates = s))

  mainStateSync('league-client-ux/settings/fix-window-method-a-options', (s) => {
    app.settings.fixWindowMethodAOptions = s
  })

  mainStateSync(
    'app/settings/show-free-software-declaration',
    (s) => (app.settings.showFreeSoftwareDeclaration = s)
  )

  mainStateSync('app/updates/is-checking-updates', (s) => (app.updates.isCheckingUpdates = s))

  mainStateSync('app/updates/new-updates', (s) => (app.updates.newUpdates = s))

  mainStateSync('app/updates/last-check-at', (s) => (app.updates.lastCheckAt = s))

  mainCall('app/version/get').then((version) => {
    app.version = version
  })
}

export function setAutoConnect(enabled: boolean) {
  return mainCall('app/settings/auto-connect/set', enabled)
}

export function setAutoCheckUpdates(enabled: boolean) {
  return mainCall('app/settings/auto-check-updates/set', enabled)
}

export function setShowFreeSoftwareDeclaration(enabled: boolean) {
  return mainCall('app/settings/show-free-software-declaration/set', enabled)
}

export function setFixWindowMethodAOptions(options: { baseWidth: number; baseHeight: number }) {
  return mainCall('league-client-ux/settings/fix-window-method-a-options/set', options)
}

/**
 * 尝试迁移所有设置项到新版本中
 */
async function migrateFromPreviousLocalStorageSettings() {
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
    await mainCall('app/migrate-settings-from-previous-local-storage', all)
    localStorage.clear()
  } catch {}
}
