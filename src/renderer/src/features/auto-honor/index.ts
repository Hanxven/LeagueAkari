import { mainCall, mainStateSync } from '@renderer/utils/ipc'

import { useAutoHonorStore } from './store'

export async function setupAutoHonor() {
  const autoHonor = useAutoHonorStore()

  mainStateSync('auto-honor/settings/enabled', (s) => (autoHonor.settings.enabled = s))
  mainStateSync('auto-honor/settings/strategy', (s) => (autoHonor.settings.strategy = s))
}

export function setEnableAutoHonor(enabled: boolean) {
  return mainCall('auto-honor/settings/enabled/set', enabled)
}

export function setAutoHonorStrategy(strategy: string) {
  return mainCall('auto-accept/settings/strategy/set', strategy)
}
