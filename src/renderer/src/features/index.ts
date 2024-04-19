import { setupApp } from './app'
import { setupAutoAccept } from './auto-accept'
import { setupAutoHonor } from './auto-honor'
import { setupAutoReply } from './auto-reply'
import { setupAutoSelect } from './auto-select'
import { setupCoreFunctionality } from './core-functionality'
import { setupDebug } from './debug'
import { setupGameData } from './game-data'
import { setupStateUpdater } from './lcu-state-sync'
import { setupRespawnTimer } from './respawn-timer'

export async function setupLeagueAkariFeatures() {
  // 应用本身的相关状态
  await setupApp()

  // 所有涉及到 LCU 状态的更新
  await setupStateUpdater()

  await setupDebug()

  await setupGameData()

  await setupCoreFunctionality()

  await setupAutoAccept()

  await setupAutoReply()

  await setupAutoSelect()

  await setupAutoHonor()

  await setupRespawnTimer()
}
