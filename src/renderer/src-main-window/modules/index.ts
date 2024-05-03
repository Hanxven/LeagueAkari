import { setupApp } from '@shared/renderer/modules/app'
import { setupAutoGameflow } from '@shared/renderer/modules/auto-gameflow'
import { setupAutoReply } from '@shared/renderer/modules/auto-reply'
import { setupAutoSelect } from '@shared/renderer/modules/auto-select'
import { setupAuxiliaryWindow } from '@shared/renderer/modules/auxiliary-window'
import { setupCoreFunctionality } from '@shared/renderer/modules/core-functionality'
import { setupCustomKeyboardSequence } from '@shared/renderer/modules/custom-keyboard-sequence'
import { setupGameData } from '@shared/renderer/modules/game-data'
import { setupLcuStateSync } from '@shared/renderer/modules/lcu-state-sync'
import { setupMainWindow } from '@shared/renderer/modules/main-window'
import { setupRespawnTimer } from '@shared/renderer/modules/respawn-timer'

import { setupDebug } from './debug'
import { setupMatchHistoryTabs } from './match-history-tabs'

export async function setupLeagueAkariFeatures() {
  // 应用本身的相关状态
  await setupApp()

  await setupMainWindow()

  await setupAuxiliaryWindow()

  // 所有涉及到 LCU 状态的更新
  await setupLcuStateSync()

  await setupDebug()

  await setupGameData()

  await setupCoreFunctionality()

  await setupMatchHistoryTabs()

  await setupAutoReply()

  await setupAutoSelect()

  await setupAutoGameflow()

  await setupRespawnTimer()

  await setupCustomKeyboardSequence()
}
