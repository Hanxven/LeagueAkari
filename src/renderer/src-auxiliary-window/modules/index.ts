import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari/renderer-module-manager'
import { setupApp } from '@shared/renderer/modules/app'
import { autoGameflowRendererModule } from '@shared/renderer/modules/auto-gameflow-new'
import { setupAutoSelect } from '@shared/renderer/modules/auto-select'
import { setupAuxiliaryWindow } from '@shared/renderer/modules/auxiliary-window'
import { setupExternalDataSource } from '@shared/renderer/modules/external-data-source'
import { lcuSyncModule } from '@shared/renderer/modules/lcu-state-sync-new'

export async function setupLeagueAkariFeatures() {
  await setupApp()

  await setupAuxiliaryWindow()

  // await setupLcuStateSync()

  // await setupAutoGameflow()

  await setupAutoSelect()

  await setupExternalDataSource()
}

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariModules() {
  await manager.register(lcuSyncModule)
  await manager.register(autoGameflowRendererModule)
  manager.setup()
}
