import { StateSyncModule } from '@shared/renderer/akari/state-sync-module'
import { mainCall, mainStateSync } from '@shared/renderer/utils/ipc'

import { useAutoReplyStore } from './store'

export async function setupAutoReply() {
  const autoReply = useAutoReplyStore()

  mainStateSync('auto-reply/settings/enabled', (s) => (autoReply.settings.enabled = s))
  mainStateSync('auto-reply/settings/enable-on-away', (s) => (autoReply.settings.enableOnAway = s))
  mainStateSync('auto-reply/settings/text', (s) => (autoReply.settings.text = s))
}

export function setAutoReplyEnabled(enabled: boolean) {
  return mainCall('auto-reply/settings/enabled/set', enabled)
}

export function setAutoReplyText(text: string) {
  return mainCall('auto-reply/settings/text/set', text)
}

export function setEnableOnAway(enabled: boolean) {
  return mainCall('auto-reply/settings/enable-on-away/set', enabled)
}

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

    this.simpleSync('settings/enabled', (s) => (store.settings.enabled = s))
    this.simpleSync('settings/enable-on-away', (s) => (store.settings.enableOnAway = s))
    this.simpleSync('settings/text', (s) => (store.settings.text = s))
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