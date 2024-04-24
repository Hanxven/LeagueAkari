import { mainStateSync } from '@shared/renderer-utils/ipc'

import { useAppStore } from './store'

export async function setupApp() {
  const app = useAppStore()

  mainStateSync('auxiliary-window/state', (s) => (app.windowState = s))

  mainStateSync('auxiliary-window/focus', (s) => (app.focusState = s))

  mainStateSync('lcu-connection/auth', (s) => (app.lcuAuth = s))

  mainStateSync('lcu-connection/state', (s) => (app.lcuConnectionState = s))

  mainStateSync('auxiliary-window/is-show', (s) => (app.isShow = s))

  mainStateSync('auxiliary-window/is-pinned', (s) => (app.isPinned = s))
}
