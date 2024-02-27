import { setupApp } from './app'
import { setupAutoAccept } from './auto-accept'
import { setupAutoHonor } from './auto-honor'
import { setupAutoReply } from './auto-reply'
import { setupAutoSelect } from './auto-select'
import { setupDebug } from './debug'
import { setupGameData } from './game-data'
import { setupMatchHistory } from './match-history'
import { setupStateUpdater } from './update/lcu-state-update'

export async function setupLeagueToolkitFeatures() {
  // 应用本身的相关状态
  setupApp()

  // 所有涉及到 LCU 状态的更新
  setupStateUpdater()

  setupDebug()

  setupGameData()

  setupMatchHistory()
  
  setupAutoAccept()

  setupAutoReply()

  setupAutoSelect()

  setupAutoHonor()
}
