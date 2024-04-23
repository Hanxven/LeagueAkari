import { lcuEventBus } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { mwNotification } from '@main/core/main-window'
import { chatSend } from '@main/http-api/chat'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { ChatMessage } from '@shared/types/lcu/chat'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'

import { chat } from '../lcu-state-sync/chat'
import { summoner } from '../lcu-state-sync/summoner'
import { autoReplyState } from './state'

const logger = createLogger('auto-reply')

export async function setupAutoReply() {
  stateSync()
  ipcCall()
  await loadSettings()

  lcuEventBus.on<LcuEvent<ChatMessage>>(
    '/lol-chat/v1/conversations/:fromId/messages/:messageId',
    async (event, { fromId }) => {
      if (
        autoReplyState.settings.enabled &&
        event.data &&
        summoner.me &&
        event.data.type === 'chat' &&
        event.data.fromSummonerId !== summoner.me.summonerId &&
        autoReplyState.settings.text
      ) {
        if (autoReplyState.settings.enableOnAway && chat.me?.availability !== 'away') {
          return
        }

        try {
          await chatSend(fromId, autoReplyState.settings.text)
        } catch (error) {
          mwNotification.warn('auto-reply', '自动回复', '无法发送信息')
          logger.warn(`尝试自动回复时出现错误 ${formatError(error)}`)
        }
      }
    }
  )

  logger.info('初始化完成')
}

function stateSync() {
  ipcStateSync('auto-reply/settings/enabled', () => autoReplyState.settings.enabled)
  ipcStateSync('auto-reply/settings/enable-on-away', () => autoReplyState.settings.enableOnAway)
  ipcStateSync('auto-reply/settings/text', () => autoReplyState.settings.text)
}

function ipcCall() {
  onRendererCall('auto-reply/settings/enabled/set', async (_, enabled) => {
    autoReplyState.settings.setEnabled(enabled)
    await setSetting('auto-reply/enabled', enabled)
  })

  onRendererCall('auto-reply/settings/enable-on-away/set', async (_, enabled) => {
    autoReplyState.settings.setEnableOnAway(enabled)
    await setSetting('auto-reply/enable-on-away', enabled)
  })

  onRendererCall('auto-reply/settings/text/set', async (_, text) => {
    autoReplyState.settings.setText(text)
    await setSetting('auto-reply/text', text)
  })
}

async function loadSettings() {
  autoReplyState.settings.setEnabled(
    await getSetting('auto-reply/enabled', autoReplyState.settings.enabled)
  )

  autoReplyState.settings.setEnableOnAway(
    await getSetting('auto-reply/enable-on-away', autoReplyState.settings.enableOnAway)
  )

  autoReplyState.settings.setText(await getSetting('auto-reply/text', autoReplyState.settings.text))
}
