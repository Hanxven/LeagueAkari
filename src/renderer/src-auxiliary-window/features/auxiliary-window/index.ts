import { mainStateSync } from '@shared/renderer/utils/ipc'

import { useAuxiliaryWindowStore } from './store'

export async function setupAuxiliaryWindow() {
  const app = useAuxiliaryWindowStore()

  mainStateSync('auxiliary-window/state', (s) => (app.windowState = s))

  mainStateSync('auxiliary-window/focus', (s) => (app.focusState = s))

  mainStateSync('auxiliary-window/is-show', (s) => (app.isShow = s))

  mainStateSync('auxiliary-window/is-pinned', (s) => (app.isPinned = s))
}
