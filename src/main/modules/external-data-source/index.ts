import { createLogger } from '@main/core-modules/log'
import { ipcStateSync } from '@main/utils/ipc'
import { FandomWikiChampBalanceDataSource } from '@shared/external-data-source/fandom/champ-balance'
import { formatError } from '@shared/utils/errors'
import { computed, reaction } from 'mobx'

import { gameflow } from '../lcu-state-sync/gameflow'
import { externalDataSourceState as eds } from './state'

const logger = createLogger('external-data-source')

const balanceModes = new Map<string, string>([
  ['ARAM', 'aram'],
  ['ONEFORALL', 'ofa'],
  ['URF', 'urf'],
  ['ARURF', 'urf'],
  ['CHERRY', 'ar']
  // ['USB', 'usb'] // 终极魔典？
])

export async function setupExternalDataSource() {
  eds.balance.dataSource = new FandomWikiChampBalanceDataSource()
  eds.balance.updateData()

  stateSync()

  const gameMode = computed(() => {
    if (!gameflow.session) {
      return null
    }

    return gameflow.session.map.gameMode
  })

  reaction(
    () => gameMode.get(),
    async (mode) => {
      if (!mode) {
        return
      }

      if (balanceModes.has(mode)) {
        try {
          logger.info(
            `更新英雄平衡性数据，数据源 ${eds.balance.dataSource.name} ${eds.balance.dataSource.version}`
          )
          await eds.balance.updateData()
        } catch (error) {
          logger.warn(`获取英雄平衡性数据源时发生错误 ${formatError(error)}`)
        }
      }
    }
  )

  logger.info('初始化完成')
}

function stateSync() {
  ipcStateSync('external-data-source/balance', () => eds.balance.data)
}
