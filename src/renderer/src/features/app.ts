import { call, onUpdate } from '@renderer/ipc'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useAppState } from './stores/app'
import { useSettingsStore } from './stores/settings'

export const id = 'core:app'

export function setupAppState() {
  const appState = useAppState()

  loadSettingsFromStorage()

  call('getWindowState').then((windowState) => {
    appState.windowState = windowState
  })

  call('isAdmin').then((isAdmin) => {
    appState.isAdmin = isAdmin
  })

  call('getVersion').then((version) => {
    appState.version = version
  })

  onUpdate('isAdmin', (_e, isAdmin) => {
    appState.isAdmin = isAdmin
  })

  onUpdate('windowState', (_e, windowState0) => {
    appState.windowState = windowState0
  })

  onUpdate('focusState', (_e, focusState) => {
    appState.focusState = focusState
  })
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.app.autoConnect = getSetting('app.autoConnect', true)

  const options = getSetting('app.fixWindowMethodAOptions')
  if (options) {
    settings.app.fixWindowMethodAOptions = options
  }
}

export function setFixWindowMethodAOptions(baseWidth: number, baseHeight: number) {
  const settings = useSettingsStore()

  setSetting('app.fixWindowMethodAOptions', { baseHeight, baseWidth })
  settings.app.fixWindowMethodAOptions = {
    baseWidth,
    baseHeight
  }
}

export function setAutoConnect(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('app.autoConnect', enabled)
  settings.app.autoConnect = enabled
}
