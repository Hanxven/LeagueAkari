import { createLogger } from '@main/modules/akari-core/log'

import { champSelectSync } from './champ-select'
import { chatSync } from './chat'
import { gameDataSync } from './game-data'
import { gameflowSync } from './gameflow'
import { honorSync } from './honor'
import { lobbySync } from './lobby'
import { loginSync } from './login'
import { matchmakingSync } from './matchmaking'
import { summonerSync } from './summoner'

const logger = createLogger('lcu-state-sync')

/**
 * 处理主进程和 League Client 的状态同步
 *
 * 以及封装后的状态和其他渲染进程的状态同步
 */
export async function setupLcuStateSync() {
  gameflowSync()

  gameDataSync()

  summonerSync()

  lobbySync()

  chatSync()

  champSelectSync()

  loginSync()

  matchmakingSync()

  honorSync()

  logger.info('初始化完成')
}
