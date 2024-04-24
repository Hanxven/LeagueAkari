import { mainCall, mainStateSync } from '@shared/renderer-utils/ipc'

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
