import { setupApp } from '@shared/renderer/modules/app'
import { setupAutoGameflow } from '@shared/renderer/modules/auto-gameflow'
import { setupAutoSelect } from '@shared/renderer/modules/auto-select'
import { setupAuxiliaryWindow } from '@shared/renderer/modules/auxiliary-window'
import { setupExternalDataSource } from '@shared/renderer/modules/external-data-source'
import { setupLcuStateSync } from '@shared/renderer/modules/lcu-state-sync'

export async function setupLeagueAkariFeatures() {
  await setupApp()

  await setupAuxiliaryWindow()

  await setupLcuStateSync()

  await setupAutoGameflow()

  await setupAutoSelect()

  await setupExternalDataSource()
}
