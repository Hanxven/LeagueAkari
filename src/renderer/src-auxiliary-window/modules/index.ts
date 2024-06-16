import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari/renderer-module-manager'
import { appRendererModule } from '@shared/renderer/modules/app-new'
import { autoGameflowRendererModule } from '@shared/renderer/modules/auto-gameflow-new'
import { autoSelectRendererModule } from '@shared/renderer/modules/auto-select-new'
import { auxiliaryWindowRendererModule } from '@shared/renderer/modules/auxiliary-window-new'
import { externalDataSourceRendererModule } from '@shared/renderer/modules/external-data-source-new'
import { lcuConnectionRendererModule } from '@shared/renderer/modules/lcu-connection-new'
import { lcuSyncRendererModule } from '@shared/renderer/modules/lcu-state-sync-new'

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariModules() {
  manager.use(lcuSyncRendererModule)
  manager.use(autoGameflowRendererModule)
  manager.use(autoSelectRendererModule)
  manager.use(auxiliaryWindowRendererModule)
  manager.use(appRendererModule)
  manager.use(lcuConnectionRendererModule)
  manager.use(externalDataSourceRendererModule)

  await manager.setup()
}
