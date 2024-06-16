import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari/renderer-module-manager'
import { appRendererModule } from '@shared/renderer/modules/app-new'
import { autoGameflowRendererModule } from '@shared/renderer/modules/auto-gameflow-new'
import { autoReplyRendererModule } from '@shared/renderer/modules/auto-reply-new'
import { autoSelectRendererModule } from '@shared/renderer/modules/auto-select-new'
import { auxiliaryWindowRendererModule } from '@shared/renderer/modules/auxiliary-window-new'
import { coreFunctionalityRendererModule } from '@shared/renderer/modules/core-functionality-new'
import { lcuClientRendererModule } from '@shared/renderer/modules/lcu-client-new'
import { lcuConnectionRendererModule } from '@shared/renderer/modules/lcu-connection-new'
import { lcuSyncRendererModule } from '@shared/renderer/modules/lcu-state-sync-new'
import { mainWindowRendererModule } from '@shared/renderer/modules/main-window-new'
import { respawnTimerRendererModule } from '@shared/renderer/modules/respawn-timer-new'
import { storageRendererModule } from '@shared/renderer/modules/storage-new'

import { debugRendererModule } from './debug'
import { matchHistoryTabsRendererModule } from './match-history-tabs-new'

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariRendererModules() {
  manager.use(appRendererModule)
  manager.use(lcuSyncRendererModule)
  manager.use(autoGameflowRendererModule)
  manager.use(coreFunctionalityRendererModule)
  manager.use(lcuClientRendererModule)
  manager.use(matchHistoryTabsRendererModule)
  manager.use(lcuConnectionRendererModule)
  manager.use(mainWindowRendererModule)
  manager.use(respawnTimerRendererModule)
  manager.use(auxiliaryWindowRendererModule)
  manager.use(autoSelectRendererModule)
  manager.use(autoReplyRendererModule)
  manager.use(storageRendererModule)
  manager.use(debugRendererModule)

  await manager.setup()
}
