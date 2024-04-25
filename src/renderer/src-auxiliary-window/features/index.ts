import { setupAutoGameflow } from '@shared/renderer/features/auto-gameflow'
import { setupAutoSelect } from '@shared/renderer/features/auto-select'
import { setupLcuStateSync } from '@shared/renderer/features/lcu-state-sync'

import { setupAuxiliaryWindow } from './auxiliary-window'

export async function setupLeagueAkariFeatures() {
  await setupAuxiliaryWindow()

  await setupLcuStateSync()

  await setupAutoGameflow()

  await setupAutoSelect()
}
