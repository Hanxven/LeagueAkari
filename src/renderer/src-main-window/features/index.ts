import { setupApp } from '@shared/renderer/features/app'
import { setupAutoGameflow } from '@shared/renderer/features/auto-gameflow'
import { setupAutoReply } from '@shared/renderer/features/auto-reply'
import { setupAutoSelect } from '@shared/renderer/features/auto-select'
import { setupCoreFunctionality } from '@shared/renderer/features/core-functionality'
import { setupCustomKeyboardSequence } from '@shared/renderer/features/custom-keyboard-sequence'
import { setupGameData } from '@shared/renderer/features/game-data'
import { setupLcuStateSync } from '@shared/renderer/features/lcu-state-sync'
import { setupRespawnTimer } from '@shared/renderer/features/respawn-timer'

import { setupDebug } from './debug'
import { setupMainWindow } from './main-window'
import { setupMatchHistoryTabs } from './match-history-tabs'

export async function setupLeagueAkariFeatures() {
  // 应用本身的相关状态
  await setupApp()

  await setupMainWindow()

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
