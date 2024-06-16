import { LeagueAkariModuleManager } from '@shared/akari/main-module-manager'

import { appModule } from './akari-core/app-new'
import { auxWindowModule } from './akari-core/auxiliary-window-new'
import { lcuClientModule } from './akari-core/lcu-client-new'
import { lcuConnectionModule } from './akari-core/lcu-connection-new'
import { logModule } from './akari-core/log-new'
import { mainWindowModule } from './akari-core/main-window-new'
import { winPlatformModule } from './akari-core/platform-new'
import { storageModule } from './akari-core/storage-new'
import { autoGameflowModule } from './auto-gameflow-new'
import { autoReplyModule } from './auto-reply-new'
import { autoSelectModule } from './auto-select-new'
import { coreFunctionalityModule } from './core-functionality-new'
import { customKeyboardSequenceModule } from './custom-keyboard-sequence-new'
import { debugModule } from './debug-new'
import { lcuSyncModule } from './lcu-state-sync-new'
import { respawnTimerModule } from './respawn-timer-new'

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
