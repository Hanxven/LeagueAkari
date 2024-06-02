import { createLogger } from '@main/core-modules/log'
import { ipcStateSync } from '@main/utils/ipc'
import { FandomWikiChampBalanceDataSource } from '@shared/external-data-source/fandom/champ-balance'
import { formatError } from '@shared/utils/errors'
import { comparer, computed, reaction } from 'mobx'

import { champSelect } from '../lcu-state-sync/champ-select'
import { gameflow } from '../lcu-state-sync/gameflow'
import { externalDataSourceState as eds } from './state'

const logger = createLogger('external-data-source')

const balanceModes = new Map<string, string>([
  ['ARAM', 'aram'],
  ['ONEFORALL', 'ofa'],
  ['URF', 'urf'],
  ['CHERRY', 'ar'],
  ['ULTBOOK', 'usb']
])

// 目前所有的可用模式 (截止到 2024-05-10)
const _MODES = [
  'ARAM', // 极地大乱斗
  'ARSR', // 随机英雄的峡谷模式
  'ASSASSINATE', // 血月杀
  'CHERRY', // 竞技场
  'CLASSIC', // 经典
  'DOOMBOTSTEEMO', // 大提莫节
  'FIRSTBLOOD', // 过载
  'KINGPORO', // 魄罗大作战
  'LCURGMDISABLED', // 测试模式
  'NEXUSBLITZ', // 极限闪击
  'ONEFORALL', // 克隆大作战
  'PRACTICETOOL', // 训练模式
  'SNOWURF', // 雪球的无限火力
  'TFT', // 云顶之弈
  'TUTORIAL_MODULE_1', // 新手教程1
  'TUTORIAL_MODULE_2', // 新手教程2
  'TUTORIAL_MODULE_3', // 新手教程3
  'ULTBOOK', // 终极魔典
  'URF' // 无限火力
]

async function updateBalanceData(gameMode: string, _queueType: string) {
  if (balanceModes.has(gameMode)) {
    try {
      logger.info(
        `更新英雄平衡性数据，数据源 ${eds.balance.fandom.name}  ${eds.balance.fandom.id} ${eds.balance.fandom.version}`
      )
      await eds.balance.updateData()
    } catch (error) {
      logger.warn(`获取英雄平衡性数据源时发生错误 ${formatError(error)}`)
    }
  }
}

async function updateChampBuildData(chamionId: number, gameMode: string, _queueType: string) {
  // ARAM only now
  if (gameMode === 'ARAM') {
    const r = await eds.champBuild.opgg.getChampionARAM(chamionId)
  }
}

export async function setupExternalDataSource() {
  stateSync()

  const gameInfo = computed(() => {
    if (!gameflow.session) {
      return null
    }

    return {
      gameMode: gameflow.session.map.gameMode,
      queueType: gameflow.session.gameData.queue.type
    }
  })

  reaction(
    () => gameInfo.get(),
    async (info) => {
      if (!info) {
        return
      }

      updateBalanceData(info.gameMode, info.queueType)
    }
  )

  reaction(
    () => [champSelect.currentChampion, gameInfo.get()] as const,
    ([c, i]) => {
      if (!c || !i) {
        return
      }

      updateChampBuildData(c, i.gameMode, i.queueType)
    },
    { equals: comparer.structural }
  )

  logger.info('初始化完成')
}

function stateSync() {
  ipcStateSync('external-data-source/balance/data', () => eds.balance.data)
}
