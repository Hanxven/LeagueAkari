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

    this.getterSync('settings/enabled', (s) => (store.settings.enabled = s))
    this.getterSync('settings/enable-on-away', (s) => (store.settings.enableOnAway = s))
    this.getterSync('settings/text', (s) => (store.settings.text = s))
  }

  setEnabled(enabled: boolean) {
    return this.call('set-setting/enabled', enabled)
  }

  setEnableOnAway(enabled: boolean) {
    return this.call('set-setting/enable-on-away', enabled)
  }

  setText(text: string) {
    return this.call('set-setting/text', text)
  }
}

export const autoReplyRendererModule = new AutoReplyRendererModule()
