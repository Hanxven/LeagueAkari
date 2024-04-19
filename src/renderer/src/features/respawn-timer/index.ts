import { mainCall, mainStateSync } from '@renderer/utils/ipc'

import { useRespawnTimerStore } from './store'

export const id = 'feature:respawn-timer'

export async function setupRespawnTimer() {
  const respawnTimer = useRespawnTimerStore()

  mainStateSync('respawn-timer/settings/enabled', (s) => (respawnTimer.settings.enabled = s))
  mainStateSync('respawn-timer/is-dead', (s) => (respawnTimer.isDead = s))
  mainStateSync('respawn-timer/time-left', (s) => (respawnTimer.timeLeft = s))
  mainStateSync('respawn-timer/total-time', (s) => (respawnTimer.totalTime = s))
}

export function setEnableRespawnTimer(enabled: boolean) {
  return mainCall('respawn-timer/settings/enabled/set', enabled)
}
