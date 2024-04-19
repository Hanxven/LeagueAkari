import { setupAutoAccept } from './auto-accept'
import { setupAutoHonor } from './auto-honor'
import { setupAutoReply } from './auto-reply'
import { setupAutoSelect } from './auto-select'
import { setupCoreFunctionality } from './core-functionality'
import { setupDebug } from './debug'
import { setupLcuStateSync } from './lcu-state-sync'
import { setupRespawnTimer } from './respawn-timer'

export async function setupLeagueAkariFeatures() {
  await setupLcuStateSync()

  await setupDebug()

  await setupCoreFunctionality()

  await setupAutoAccept()

  await setupAutoReply()

  await setupAutoHonor()

  await setupAutoSelect()

  await setupRespawnTimer()
}
