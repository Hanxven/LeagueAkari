import { setupAutoGameflow } from '@shared/renderer/modules/auto-gameflow'
import { setupAutoSelect } from '@shared/renderer/modules/auto-select'
import { setupLcuStateSync } from '@shared/renderer/modules/lcu-state-sync'

import { setupAuxiliaryWindow } from '@shared/renderer/modules/auxiliary-window'

export async function setupLeagueAkariFeatures() {
  await setupAuxiliaryWindow()

  await setupLcuStateSync()

  await setupAutoGameflow()

  await setupAutoSelect()
}
