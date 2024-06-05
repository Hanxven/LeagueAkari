import { LeagueAkariModuleManager } from '@shared/akari/main-module-manager'

import { autoGameflowModule } from './auto-gameflow-new'
import { setupAutoReply } from './auto-reply'
import { setupAutoSelect } from './auto-select'
import { setupCoreFunctionality } from './core-functionality'
import { coreFunctionalityModule } from './core-functionality-new'
import { setupCustomKeyboardSequence } from './custom-keyboard-sequence'
import { setupDebug } from './debug'
import { setupExternalDataSource } from './external-data-source'
import { lcuModule } from './lcu-state-sync-new'
import { setupRespawnTimer } from './respawn-timer'

export async function setupLeagueAkariFeatures() {
  // await setupLcuStateSync()

  await setupDebug()

  // await setupCoreFunctionality()

  await setupAutoReply()

  // await setupAutoGameflow()

  await setupAutoSelect()

  await setupRespawnTimer()

  await setupCustomKeyboardSequence()

  await setupExternalDataSource()
}

const manager = new LeagueAkariModuleManager()

export async function setupLeagueAkariModules() {
  await manager.register(lcuModule)
  await manager.register(autoGameflowModule)
  await manager.register(coreFunctionalityModule)
  manager.setup()
}
