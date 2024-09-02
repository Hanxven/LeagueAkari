import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { useCustomKeyboardSequenceStore } from './store'

export class CustomKeyboardSequenceRendererModule extends StateSyncModule {
  constructor() {
    super('custom-keyboard-sequence')
  }

  override async setup() {
    await super.setup()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useCustomKeyboardSequenceStore()

    this.simpleSync('settings/enabled', (s) => (store.settings.enabled = s))
    this.simpleSync('settings/text', (s) => (store.settings.text = s))
  }

  setEnabled(enabled: boolean) {
    return this.call('set-setting/enabled', enabled)
  }

  setText(text: string) {
    return this.call('set-setting/text', text)
  }
}

export const customKeyboardSequenceRendererModule = new CustomKeyboardSequenceRendererModule()
