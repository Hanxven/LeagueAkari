import { mainCall, mainStateSync } from '@renderer/utils/ipc'

import { useAutoGameflowStore } from './store'

export async function setupAutoGameflow() {
  const autoGameflow = useAutoGameflowStore()

  mainStateSync(
    'auto-gameflow/settings/auto-honor-enabled',
    (s) => (autoGameflow.settings.autoHonorEnabled = s)
  )
  mainStateSync(
    'auto-gameflow/settings/auto-honor-strategy',
    (s) => (autoGameflow.settings.autoHonorStrategy = s)
  )
  mainStateSync(
    'auto-gameflow/settings/play-again-enabled',
    (s) => (autoGameflow.settings.playAgainEnabled = s)
  )

  mainStateSync('auto-gameflow/will-auto-accept', (s) => (autoGameflow.willAutoAccept = s))

  mainStateSync('auto-gameflow/will-auto-accept-at', (s) => (autoGameflow.willAutoAcceptAt = s))

  mainStateSync(
    'auto-gameflow/settings/auto-accept-enabled',
    (s) => (autoGameflow.settings.autoAcceptEnabled = s)
  )

  mainStateSync(
    'auto-gameflow/settings/auto-accept-delay-seconds',
    (s) => (autoGameflow.settings.autoAcceptDelaySeconds = s)
  )
}

export function setEnableAutoHonor(enabled: boolean) {
  return mainCall('auto-gameflow/settings/auto-honor-enabled/set', enabled)
}

export function setAutoHonorStrategy(strategy: string) {
  return mainCall('auto-gameflow/settings/auto-honor-strategy/set', strategy)
}

export function setPlayAgainEnabled(enabled: boolean) {
  return mainCall('auto-gameflow/settings/play-again-enabled/set', enabled)
}

export function setEnableAutoAccept(enabled: boolean) {
  return mainCall('auto-gameflow/settings/auto-accept-enabled/set', enabled)
}

export async function cancelAutoAccept() {
  return mainCall('auto-gameflow/cancel-auto-accept')
}

export async function setAutoAcceptDelaySeconds(seconds: number) {
  return mainCall('auto-gameflow/settings/auto-accept-delay-seconds/set', seconds)
}
