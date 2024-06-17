import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari/renderer-module-manager'
import { appRendererModule } from '@shared/renderer/modules/app'
import { autoGameflowRendererModule } from '@shared/renderer/modules/auto-gameflow'
import { autoSelectRendererModule } from '@shared/renderer/modules/auto-select'
import { auxiliaryWindowRendererModule } from '@shared/renderer/modules/auxiliary-window'
import { externalDataSourceRendererModule } from '@shared/renderer/modules/external-data-source'
import { lcuConnectionRendererModule } from '@shared/renderer/modules/lcu-connection'
import { lcuSyncRendererModule } from '@shared/renderer/modules/lcu-state-sync'

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
