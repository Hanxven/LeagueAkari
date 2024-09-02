import { LeagueAkariRendererModuleManager } from '@renderer-shared/akari-ipc/renderer-module-manager'
import { appRendererModule } from '@renderer-shared/modules/app'
import { autoGameflowRendererModule } from '@renderer-shared/modules/auto-gameflow'
import { autoSelectRendererModule } from '@renderer-shared/modules/auto-select'
import { auxiliaryWindowRendererModule } from '@renderer-shared/modules/auxiliary-window'
import { externalDataSourceRendererModule } from '@renderer-shared/modules/external-data-source'
import { lcuConnectionRendererModule } from '@renderer-shared/modules/lcu-connection'
import { lcuSyncRendererModule } from '@renderer-shared/modules/lcu-state-sync'

import { opggRendererModule } from './opgg'

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariModules() {
  manager.use(lcuSyncRendererModule)
  manager.use(autoGameflowRendererModule)
  manager.use(autoSelectRendererModule)
  manager.use(auxiliaryWindowRendererModule)
  manager.use(appRendererModule)
  manager.use(lcuConnectionRendererModule)
  manager.use(externalDataSourceRendererModule)
  manager.use(opggRendererModule)

  await manager.setup()
}
