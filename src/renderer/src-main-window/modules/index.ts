import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari/renderer-module-manager'
import { setupApp } from '@shared/renderer/modules/app'
import { autoGameflowRendererModule } from '@shared/renderer/modules/auto-gameflow-new'
import { setupAutoReply } from '@shared/renderer/modules/auto-reply'
import { setupAutoSelect } from '@shared/renderer/modules/auto-select'
import { setupAuxiliaryWindow } from '@shared/renderer/modules/auxiliary-window'
import { setupCoreFunctionality } from '@shared/renderer/modules/core-functionality'
import { setupCustomKeyboardSequence } from '@shared/renderer/modules/custom-keyboard-sequence'
import { setupGameData } from '@shared/renderer/modules/game-data'
import { lcuRendererModule } from '@shared/renderer/modules/lcu-state-sync-new'
import { setupMainWindow } from '@shared/renderer/modules/main-window'
import { setupRespawnTimer } from '@shared/renderer/modules/respawn-timer'

import { setupDebug } from './debug'
import { setupMatchHistoryTabs } from './match-history-tabs'

export async function setupLeagueAkariFeatures() {
  await setupApp()

  await setupMainWindow()

  await setupAuxiliaryWindow()

  // await setupLcuStateSync()

  await setupDebug()

  await setupGameData()

  await setupCoreFunctionality()

  await setupMatchHistoryTabs()

  await setupAutoReply()

  await setupAutoSelect()

  // await setupAutoGameflow()

  await setupRespawnTimer()

  await setupCustomKeyboardSequence()
}

const manager = new LeagueAkariRendererModuleManager()

export async function setupLeagueAkariRendererModules() {
  await manager.register(lcuRendererModule)
  await manager.register(autoGameflowRendererModule)
  manager.setup()
}
