import { mainCall, mainStateSync } from '@renderer/utils/ipc'

import { useAutoAcceptStore } from './store'

export const id = 'feature:auto-accept'

export async function setupAutoAccept() {
  const autoAccept = useAutoAcceptStore()

  mainStateSync('auto-accept/will-auto-accept', (s) => (autoAccept.willAutoAccept = s))
  mainStateSync('auto-accept/will-auto-accept-at', (s) => (autoAccept.willAutoAcceptAt = s))
  mainStateSync('auto-accept/settings/enabled', (s) => (autoAccept.settings.enabled = s))
  mainStateSync('auto-accept/settings/delay-seconds', (s) => (autoAccept.settings.delaySeconds = s))
}

export function setEnableAutoAccept(enabled: boolean) {
  return mainCall('auto-accept/settings/enabled/set', enabled)
}

export async function cancelAutoAccept() {
  return mainCall('auto-accept/cancel')
}

export async function setDelaySeconds(seconds: number) {
  return mainCall('auto-accept/settings/delay-seconds/set', seconds)
}
