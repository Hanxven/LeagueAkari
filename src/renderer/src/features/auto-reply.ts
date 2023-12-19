import { notify } from '@renderer/events/notifications'
import { chatSend } from '@renderer/http-api/chat'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useChatStore } from './stores/lcu/chat'
import { useSummonerStore } from './stores/lcu/summoner'
import { useSettingsStore } from './stores/settings'
import { onLcuEvent } from './update/lcu-events'

export const id = 'feature:auto-reply'

export function setupAutoReply() {
  const settings = useSettingsStore()
  const summoner = useSummonerStore()
  const chat = useChatStore()

  loadSettingsFromStorage()

  onLcuEvent(
    '/lol-chat/v1/conversations/:fromId/messages/:messageId',
    async (event, { fromId }) => {
      if (
        settings.autoReply.enabled &&
        event.data &&
        summoner.currentSummoner &&
        event.data.type === 'chat' &&
        event.data.fromSummonerId !== summoner.currentSummoner.summonerId &&
        settings.autoReply.text
      ) {
        if (settings.autoReply.enableOnAway && chat.me?.availability !== 'away') {
          return
        }

        try {
          await chatSend(fromId, settings.autoReply.text)
        } catch (err) {
          notify.emit({
            content: '尝试发送消息失败',
            type: 'warning',
            silent: true,
            id,
            extra: { error: err }
          })
        }
      }
    }
  )
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.autoReply.enabled = getSetting('autoReply.enabled', false)
  settings.autoReply.text = getSetting('autoReply.text', '')
  settings.autoReply.enableOnAway = getSetting('autoReply.enableOnAway', false)
}

export function setAutoReply(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoReply.enabled', enabled)
  settings.autoReply.enabled = enabled
}

export function setAutoReplyText(text: string) {
  const settings = useSettingsStore()

  setSetting('autoReply.text', text)
  settings.autoReply.text = text
}

export function setEnableOnAway(v: boolean) {
  const settings = useSettingsStore()

  setSetting('autoReply.enableOnAway', v)
  settings.autoReply.enableOnAway = v
}
