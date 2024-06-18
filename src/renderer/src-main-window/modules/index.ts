import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari-ipc/renderer-module-manager'
import { appRendererModule } from '@shared/renderer/modules/app'
import { autoGameflowRendererModule } from '@shared/renderer/modules/auto-gameflow'
import { autoReplyRendererModule } from '@shared/renderer/modules/auto-reply'
import { autoSelectRendererModule } from '@shared/renderer/modules/auto-select'
import { auxiliaryWindowRendererModule } from '@shared/renderer/modules/auxiliary-window'
import { coreFunctionalityRendererModule } from '@shared/renderer/modules/core-functionality'
import { customKeyboardSequenceRendererModule } from '@shared/renderer/modules/custom-keyboard-sequence'
import { leagueClientRendererModule } from '@shared/renderer/modules/league-client'
import { lcuConnectionRendererModule } from '@shared/renderer/modules/lcu-connection'
import { lcuSyncRendererModule } from '@shared/renderer/modules/lcu-state-sync'
import { mainWindowRendererModule } from '@shared/renderer/modules/main-window'
import { respawnTimerRendererModule } from '@shared/renderer/modules/respawn-timer'
import { storageRendererModule } from '@shared/renderer/modules/storage'

import { debugRendererModule } from './debug'
import { matchHistoryTabsRendererModule } from './match-history-tabs'

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariRendererModules() {
  manager.use(appRendererModule)
  manager.use(lcuSyncRendererModule)
  manager.use(autoGameflowRendererModule)
  manager.use(coreFunctionalityRendererModule)
  manager.use(leagueClientRendererModule)
  manager.use(matchHistoryTabsRendererModule)
  manager.use(lcuConnectionRendererModule)
  manager.use(mainWindowRendererModule)
  manager.use(respawnTimerRendererModule)
  manager.use(auxiliaryWindowRendererModule)
  manager.use(autoSelectRendererModule)
  manager.use(autoReplyRendererModule)
  manager.use(storageRendererModule)
  manager.use(debugRendererModule)
  manager.use(customKeyboardSequenceRendererModule)

  await manager.setup()
}
