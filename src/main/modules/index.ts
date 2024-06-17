import { LeagueAkariModuleManager } from '@shared/akari/main-module-manager'

import { appModule } from './akari-core/app'
import { auxWindowModule } from './akari-core/auxiliary-window'
import { lcuClientModule } from './akari-core/lcu-client'
import { lcuConnectionModule } from './akari-core/lcu-connection'
import { logModule } from './akari-core/log'
import { mainWindowModule } from './akari-core/main-window'
import { winPlatformModule } from './akari-core/platform'
import { storageModule } from './akari-core/storage'
import { autoGameflowModule } from './auto-gameflow'
import { autoReplyModule } from './auto-reply'
import { autoSelectModule } from './auto-select'
import { coreFunctionalityModule } from './core-functionality'
import { customKeyboardSequenceModule } from './custom-keyboard-sequence'
import { debugModule } from './debug'
import { lcuSyncModule } from './lcu-state-sync'
import { respawnTimerModule } from './respawn-timer'

export const manager = new LeagueAkariModuleManager()

export async function setupLeagueAkariModules() {
  manager.use(logModule)
  manager.use(storageModule)
  manager.use(appModule)
  manager.use(winPlatformModule)
  manager.use(lcuClientModule)
  manager.use(mainWindowModule)
  manager.use(auxWindowModule)
  manager.use(lcuConnectionModule)
  manager.use(lcuSyncModule)
  manager.use(autoSelectModule)
  manager.use(autoGameflowModule)
  manager.use(coreFunctionalityModule)
  manager.use(respawnTimerModule)
  manager.use(autoReplyModule)
  manager.use(customKeyboardSequenceModule)
  manager.use(debugModule)

  await manager.setup()
}
