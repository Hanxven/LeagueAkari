import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { useAutoReplyStore } from './store'

export class AutoReplyRendererModule extends StateSyncModule {
  constructor() {
    super('auto-reply')
  }

  override async setup() {
    await super.setup()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useAutoReplyStore()
    this.stateSync('state', store)
  }

  setEnabled(enabled: boolean) {
    return this.call('set-setting', 'enabled', enabled)
  }

  setEnableOnAway(enabled: boolean) {
    return this.call('set-setting', 'enableOnAway', enabled)
  }

  setText(text: string) {
    return this.call('set-setting', 'text', text)
  }
}

export const autoReplyRendererModule = new AutoReplyRendererModule()
