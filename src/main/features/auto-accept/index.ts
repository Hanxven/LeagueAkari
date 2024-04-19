import { lcuEventEmitter } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { accept } from '@main/http-api/matchmaking'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { formatError } from '@shared/utils/errors'
import { reaction } from 'mobx'

import { gameflow } from '../lcu-state-sync/gameflow'
import { autoAcceptState } from './state'
import { mwNotification } from '@main/core/main-window'

let timerId: NodeJS.Timeout | null = null

const logger = createLogger('auto-accept')

const acceptMatch = async () => {
  try {
    await accept()
  } catch (error) {
    mwNotification.warn('auto-accept', '自动接受', '尝试自动接受时出现问题')
    logger.warn(`Failed to accept match ${formatError(error)}`)
  }
  autoAcceptState.clear()
}

export function cancelAutoAccept() {
  if (autoAcceptState.willAutoAccept) {
    if (timerId) {
      logger.info(`Auto accept canceled - manually canceled`)

      clearTimeout(timerId)
      timerId = null
    }
    autoAcceptState.clear()
  }
}

export async function setupAutoAccept() {
  stateSync()
  ipcCall()
  await loadSettings()

  reaction(
    () => gameflow.phase,
    (phase) => {
      if (!autoAcceptState.settings.enabled) {
        return
      }

      if (phase === 'ReadyCheck') {
        autoAcceptState.setAt(Date.now() + autoAcceptState.settings.delaySeconds * 1e3)
        timerId = setTimeout(acceptMatch, autoAcceptState.settings.delaySeconds * 1e3)

        logger.info(
          `ReadyCheck! Will accept the match in ${autoAcceptState.settings.delaySeconds * 1e3} ms`
        )
      } else {
        if (timerId) {
          logger.info(`Auto accept canceled - not in ReadyCheck phase`)

          clearTimeout(timerId)
          timerId = null
        }
        autoAcceptState.clear()
      }
    }
  )

  // 如果玩家手动取消了本次接受，则尝试取消即将进行的自动接受（如果有）
  lcuEventEmitter.on('/lol-matchmaking/v1/ready-check', (event) => {
    if (event.data && event.data.playerResponse === 'Declined') {
      if (autoAcceptState.willAutoAccept) {
        if (timerId) {
          logger.info(`Auto accept canceled - declined`)

          clearTimeout(timerId)
          timerId = null
        }
        autoAcceptState.clear()
      }
    }
  })

  logger.info('Initialized')
}

// 主进程与其他渲染进程的状态同步
function stateSync() {
  ipcStateSync('auto-accept/will-auto-accept', () => autoAcceptState.willAutoAccept)
  ipcStateSync('auto-accept/will-auto-accept-at', () => autoAcceptState.willAutoAcceptAt)
  ipcStateSync('auto-accept/settings/enabled', () => autoAcceptState.settings.enabled)
  ipcStateSync('auto-accept/settings/delay-seconds', () => autoAcceptState.settings.delaySeconds)
}

function ipcCall() {
  onRendererCall('auto-accept/cancel', async (_) => {
    cancelAutoAccept()
  })

  onRendererCall('auto-accept/settings/enabled/set', async (_, enabled) => {
    if (!enabled) {
      cancelAutoAccept()
    }

    autoAcceptState.settings.setEnabled(enabled)
    await setSetting('auto-accept/enabled', enabled)
  })

  onRendererCall('auto-accept/settings/delay-seconds/set', async (_, delaySeconds) => {
    autoAcceptState.settings.setDelaySeconds(delaySeconds)
    await setSetting('auto-accept/delay-seconds', delaySeconds)
  })
}

async function loadSettings() {
  autoAcceptState.settings.setEnabled(
    await getSetting('auto-accept/enabled', autoAcceptState.settings.enabled)
  )

  autoAcceptState.settings.setDelaySeconds(
    await getSetting('auto-accept/delay-seconds', autoAcceptState.settings.delaySeconds)
  )
}
