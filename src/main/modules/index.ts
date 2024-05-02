import { setupAutoGameflow } from './auto-gameflow'
import { setupAutoReply } from './auto-reply'
import { setupAutoSelect } from './auto-select'
import { setupCoreFunctionality } from './core-functionality'
import { setupCustomKeyboardSequence } from './custom-keyboard-sequence'
import { setupDebug } from './debug'
import { setupLcuStateSync } from './lcu-state-sync'
import { setupRespawnTimer } from './respawn-timer'

export async function setupLeagueAkariFeatures() {
  await setupLcuStateSync()

  await setupDebug()

  await setupCoreFunctionality()

  await setupAutoReply()

  await setupAutoGameflow()

  await setupAutoSelect()

  await setupRespawnTimer()

  await setupCustomKeyboardSequence()
}
