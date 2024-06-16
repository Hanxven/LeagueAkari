import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari/renderer-module-manager'
import { setupApp } from '@shared/renderer/modules/app'
import { appRendererModule } from '@shared/renderer/modules/app-new'
import { autoGameflowRendererModule } from '@shared/renderer/modules/auto-gameflow-new'
import { setupAutoSelect } from '@shared/renderer/modules/auto-select'
import { autoSelectRendererModule } from '@shared/renderer/modules/auto-select-new'
import { setupAuxiliaryWindow } from '@shared/renderer/modules/auxiliary-window'
import { auxiliaryWindowRendererModule } from '@shared/renderer/modules/auxiliary-window-new'
import { setupExternalDataSource } from '@shared/renderer/modules/external-data-source'
import { lcuConnectionRendererModule } from '@shared/renderer/modules/lcu-connection-new'
import { lcuSyncRendererModule } from '@shared/renderer/modules/lcu-state-sync-new'

export async function setupLeagueAkariFeatures() {
  // await setupExternalDataSource()
}

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariModules() {
  manager.use(lcuSyncRendererModule)
  manager.use(autoGameflowRendererModule)
  manager.use(autoSelectRendererModule)
  manager.use(auxiliaryWindowRendererModule)
  manager.use(appRendererModule)
  manager.use(lcuConnectionRendererModule)

  await manager.setup()
}
