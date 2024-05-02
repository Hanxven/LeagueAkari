import { createLogger } from '@main/core-modules/log'

import { champSelectSync } from './champ-select'
import { chatSync } from './chat'
import { gameDataSync } from './game-data'
import { gameflowSync } from './gameflow'
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
  // 游戏流
  gameflowSync()

  // 游戏数据
  gameDataSync()

  // 召唤师
  summonerSync()

  // 房间
  lobbySync()

  // 聊天
  chatSync()

  // 英雄选择
  champSelectSync()

  loginSync()

  matchmakingSync()

  logger.info('初始化完成')
}
