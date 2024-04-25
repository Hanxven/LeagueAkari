import { mainCall, mainStateSync } from '@shared/renderer/utils/ipc'

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

  mainStateSync('auto-gameflow/will-accept', (s) => (autoGameflow.willAccept = s))

  mainStateSync('auto-gameflow/will-accept-at', (s) => (autoGameflow.willAcceptAt = s))

  mainStateSync(
    'auto-gameflow/settings/auto-accept-enabled',
    (s) => (autoGameflow.settings.autoAcceptEnabled = s)
  )

  mainStateSync(
    'auto-gameflow/settings/auto-accept-delay-seconds',
    (s) => (autoGameflow.settings.autoAcceptDelaySeconds = s)
  )

  mainStateSync('auto-gameflow/will-search-match', (s) => (autoGameflow.willSearchMatch = s))

  mainStateSync('auto-gameflow/will-search-match-at', (s) => (autoGameflow.willSearchMatchAt = s))

  mainStateSync(
    'auto-gameflow/settings/auto-search-match-enabled',
    (s) => (autoGameflow.settings.autoSearchMatchEnabled = s)
  )

  mainStateSync(
    'auto-gameflow/settings/auto-search-match-delay-seconds',
    (s) => (autoGameflow.settings.autoSearchMatchDelaySeconds = s)
  )
}

export function setAutoHonorEnabled(enabled: boolean) {
  return mainCall('auto-gameflow/settings/auto-honor-enabled/set', enabled)
}

export function setAutoHonorStrategy(strategy: string) {
  return mainCall('auto-gameflow/settings/auto-honor-strategy/set', strategy)
}

export function setPlayAgainEnabled(enabled: boolean) {
  return mainCall('auto-gameflow/settings/play-again-enabled/set', enabled)
}

export function setAutoAcceptEnabled(enabled: boolean) {
  return mainCall('auto-gameflow/settings/auto-accept-enabled/set', enabled)
}

export async function cancelAutoAccept() {
  return mainCall('auto-gameflow/cancel-auto-accept')
}

export async function setAutoAcceptDelaySeconds(seconds: number) {
  return mainCall('auto-gameflow/settings/auto-accept-delay-seconds/set', seconds)
}

export async function setAutoSearchMatchEnabled(enabled: boolean) {
  return mainCall('auto-gameflow/settings/auto-search-match-enabled/set', enabled)
}

export async function setAutoSearchMatchDelaySeconds(seconds: number) {
  return mainCall('auto-gameflow/settings/auto-search-match-delay-seconds/set', seconds)
}

export async function cancelAutoSearchMatch() {
  return mainCall('auto-gameflow/cancel-auto-search-match')
}
