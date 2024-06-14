import { LeagueAkariModuleManager } from '@shared/akari/main-module-manager'

import { appModule } from './akari-core/app-new'
import { autoGameflowModule } from './auto-gameflow-new'
import { setupAutoReply } from './auto-reply'
import { setupAutoSelect } from './auto-select'
import { coreFunctionalityModule } from './core-functionality-new'
import { setupCustomKeyboardSequence } from './custom-keyboard-sequence'
import { setupDebug } from './debug'
import { setupExternalDataSource } from './external-data-source'
import { lcuSyncModule } from './lcu-state-sync-new'
import { setupRespawnTimer } from './respawn-timer'
import {  lcuConnectionModule } from './akari-core/lcu-connection-new'

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

export const manager = new LeagueAkariModuleManager()

export async function setupLeagueAkariModules() {
  await manager.register(appModule)
  await manager.register(lcuConnectionModule)
  await manager.register(lcuSyncModule)
  await manager.register(autoGameflowModule)
  await manager.register(coreFunctionalityModule)
  manager.setup()
}
