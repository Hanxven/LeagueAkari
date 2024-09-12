import { LeagueAkariModuleManager } from '@main/akari-ipc/main-module-manager'

import { appModule } from './app'
import { autoUpdateModule } from './auto-update'
import { auxWindowModule } from './auxiliary-window'
import { lcuConnectionModule } from './lcu-connection'
import { leagueClientModule } from './league-client'
import { logModule } from './log'
import { mainWindowModule } from './main-window'
import { settingsMigrateModule } from './settings-migrate'
import { winPlatformModule } from './win-platform'
import { storageModule } from './storage'
import { autoGameflowModule } from './auto-gameflow'
import { autoReplyModule } from './auto-reply'
import { autoSelectModule } from './auto-select'
import { coreFunctionalityModule } from './core-functionality'
import { customKeyboardSequenceModule } from './custom-keyboard-sequence'
import { debugModule } from './debug'
import { externalDataSourceModule } from './external-data-source'
import { lcuSyncModule } from './lcu-state-sync'
import { respawnTimerModule } from './respawn-timer'

export const manager = new LeagueAkariModuleManager()

export async function setupLeagueAkariModules() {
  // core modules, must be registered first
  manager.use(logModule)
  manager.use(storageModule)
  manager.use(appModule)
  manager.use(winPlatformModule)
  manager.use(autoUpdateModule)
  manager.use(leagueClientModule)
  manager.use(mainWindowModule)
  manager.use(auxWindowModule)
  manager.use(lcuConnectionModule)
  manager.use(settingsMigrateModule)

  // functionality modules
  manager.use(lcuSyncModule)
  manager.use(autoSelectModule)
  manager.use(autoGameflowModule)
  manager.use(coreFunctionalityModule)
  manager.use(respawnTimerModule)
  manager.use(autoReplyModule)
  manager.use(customKeyboardSequenceModule)
  manager.use(debugModule)
  manager.use(externalDataSourceModule)

  await manager.setup()
}
