import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { useMainWindowStore } from './store'

export class MainWindowRendererModule extends StateSyncModule {
  constructor() {
    super('main-window')
  }

  override async setup() {
    await super.setup()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useMainWindowStore()
    this.simpleSync('state', (s) => (store.windowState = s))
    this.simpleSync('focus', (s) => (store.focusState = s))
  }

  onAskClose(callback: () => void) {
    return this.onEvent('close-asking', callback)
  }

  close(strategy?: string) {
    return this.call('close', strategy)
  }

  toggleDevTools() {
    return this.call('toggle-devtools')
  }

  maximize() {
    return this.call('maximize')
  }

  minimize() {
    return this.call('minimize')
  }

  unmaximize() {
    return this.call('unmaximize')
  }

  restore() {
    return this.call('restore')
  }
}

export const mainWindowRendererModule = new MainWindowRendererModule()
