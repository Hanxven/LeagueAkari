import { mainCall, mainStateSync } from '@shared/renderer/utils/ipc'

import { useAuxiliaryWindowStore } from './store'

export async function setupAuxiliaryWindow() {
  const aux = useAuxiliaryWindowStore()

  mainStateSync('auxiliary-window/state', (s) => (aux.windowState = s))

  mainStateSync('auxiliary-window/focus', (s) => (aux.focusState = s))

  mainStateSync('auxiliary-window/is-show', (s) => (aux.isShow = s))

  mainStateSync('auxiliary-window/is-pinned', (s) => (aux.isPinned = s))

  mainStateSync('auxiliary-window/settings/opacity', (s) => (aux.settings.opacity = s))

  mainStateSync('auxiliary-window/settings/enabled', (s) => (aux.settings.enabled = s))

  mainStateSync(
    'auxiliary-window/settings/show-skin-selector',
    (s) => (aux.settings.showSkinSelector = s)
  )

  mainStateSync('auxiliary-window/settings/zoom-factor', (s) => (aux.settings.zoomFactor = s))
}

export function setAuxiliaryWindowEnabled(enabled: boolean) {
  return mainCall('auxiliary-window/settings/enabled/set', enabled)
}

export function setAuxiliaryWindowOpacity(opacity: number) {
  return mainCall('auxiliary-window/settings/opacity/set', opacity)
}

export function resetAuxiliaryWindowPosition() {
  return mainCall('auxiliary-window/reset-window-position')
}

export function setShowSkinSelector(b: boolean) {
  return mainCall('auxiliary-window/settings/show-skin-selector/set', b)
}

export function setZoomFactor(f: number) {
  return mainCall('auxiliary-window/settings/zoom-factor/set', f)
}
