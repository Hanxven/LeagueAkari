import { LeagueAkariRendererModuleManager } from '@renderer-shared/akari-ipc/renderer-module-manager'
import { appRendererModule } from '@renderer-shared/modules/app'
import { autoGameflowRendererModule } from '@renderer-shared/modules/auto-gameflow'
import { autoReplyRendererModule } from '@renderer-shared/modules/auto-reply'
import { autoSelectRendererModule } from '@renderer-shared/modules/auto-select'
import { autoUpdateRendererModule } from '@renderer-shared/modules/auto-update'
import { auxiliaryWindowRendererModule } from '@renderer-shared/modules/auxiliary-window'
import { coreFunctionalityRendererModule } from '@renderer-shared/modules/core-functionality'
import { customKeyboardSequenceRendererModule } from '@renderer-shared/modules/custom-keyboard-sequence'
import { externalDataSourceRendererModule } from '@renderer-shared/modules/external-data-source'
import { lcuConnectionRendererModule } from '@renderer-shared/modules/lcu-connection'
import { lcuSyncRendererModule } from '@renderer-shared/modules/lcu-state-sync'
import { leagueClientRendererModule } from '@renderer-shared/modules/league-client'
import { mainWindowRendererModule } from '@renderer-shared/modules/main-window'
import { respawnTimerRendererModule } from '@renderer-shared/modules/respawn-timer'
import { storageRendererModule } from '@renderer-shared/modules/storage'
import { tgpApiRendererModule } from '@renderer-shared/modules/tgp-api'

import { debugRendererModule } from './debug'
import { matchHistoryTabsRendererModule } from './match-history-tabs'

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariRendererModules() {
  manager.use(appRendererModule)
  manager.use(autoUpdateRendererModule)
  manager.use(lcuSyncRendererModule)
  manager.use(autoGameflowRendererModule)
  manager.use(coreFunctionalityRendererModule)
  manager.use(leagueClientRendererModule)
  manager.use(lcuConnectionRendererModule)
  manager.use(mainWindowRendererModule)
  manager.use(respawnTimerRendererModule)
  manager.use(auxiliaryWindowRendererModule)
  manager.use(autoSelectRendererModule)
  manager.use(autoReplyRendererModule)
  manager.use(storageRendererModule)
  manager.use(debugRendererModule)
  manager.use(customKeyboardSequenceRendererModule)
  manager.use(externalDataSourceRendererModule)
  manager.use(matchHistoryTabsRendererModule)
  manager.use(tgpApiRendererModule)

  await manager.setup()
}
