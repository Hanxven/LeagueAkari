import { watch } from 'vue'

import { notify } from '@renderer/events/notifications'
import { accept } from '@renderer/http-api/matchmaking'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useAutoAcceptStore } from './stores/auto-accept'
import { useGameflowStore } from './stores/lcu/gameflow'
import { useSettingsStore } from './stores/settings'
import { onLcuEvent } from './update/lcu-events'

export const id = 'feature:auto-accept'

let timerId = 0
export function setupAutoAccept() {
  const settings = useSettingsStore()
  const gameflowPhase = useGameflowStore()
  const autoAccept = useAutoAcceptStore()

  loadSettingsFromStorage()

  const acceptMatch = async () => {
    try {
      await accept()
    } catch (err) {
      notify.emit({
        id,
        type: 'warning',
        content: '尝试自动接受对局失败',
        extra: { error: err }
      })
    }
    autoAccept.willAutoAccept = false
  }

  // 不接管正在进行的 Ready Check
  watch(
    () => gameflowPhase.phase,
    (phase) => {
      if (!settings.autoAccept.enabled) {
        return
      }

      if (phase === 'ReadyCheck') {
        if (settings.autoAccept.delaySeconds <= 0.015) {
          acceptMatch()
        } else {
          autoAccept.willAutoAccept = true
          autoAccept.willAutoAcceptAt = Date.now() + settings.autoAccept.delaySeconds * 1e3
          timerId = window.setTimeout(acceptMatch, settings.autoAccept.delaySeconds * 1e3)
        }
      } else {
        if (autoAccept.willAutoAccept) {
          window.clearTimeout(timerId)
          autoAccept.willAutoAccept = false
          autoAccept.willAutoAcceptAt = -1
        }
      }
    }
  )

  // 如果用户取消了接受，那么自动接受则不会生效
  onLcuEvent('/lol-matchmaking/v1/ready-check', (event) => {
    if (event.data && event.data.playerResponse === 'Declined') {
      if (autoAccept.willAutoAccept) {
        window.clearTimeout(timerId)
        autoAccept.willAutoAccept = false
        autoAccept.willAutoAcceptAt = -1
      }
    }
  })
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.autoAccept.enabled = getSetting('autoAccept.enabled', false)
  settings.autoAccept.delaySeconds = getSetting('autoAccept.delaySeconds', 0)
}

export function enableAutoAccept() {
  const settings = useSettingsStore()

  setSetting('autoAccept.enabled', true)
  settings.autoAccept.enabled = true
}

export function disableAutoAccept() {
  const settings = useSettingsStore()
  const autoAccept = useAutoAcceptStore()

  if (autoAccept.willAutoAccept) {
    window.clearTimeout(timerId)
    autoAccept.willAutoAccept = false
    autoAccept.willAutoAcceptAt = -1
    notify.emit({
      id,
      type: 'info',
      content: '已取消即将进行的自动接受'
    })
  }

  setSetting('autoAccept.enabled', false)
  settings.autoAccept.enabled = false
}

export function cancelAutoAccept() {
  const autoAccept = useAutoAcceptStore()

  if (autoAccept.willAutoAccept) {
    window.clearTimeout(timerId)
    autoAccept.willAutoAccept = false
    autoAccept.willAutoAcceptAt = -1
  }
}

/**
 * 设置自动接受对局的延迟时间，单位为秒。设置时不会取消当前正在进行的延迟操作。
 * @param seconds 0-10
 */
export function setDelaySeconds(seconds: number) {
  const settings = useSettingsStore()

  if (seconds < 0 || seconds > 10) {
    return
  }

  setSetting('autoAccept.delaySeconds', seconds)
  settings.autoAccept.delaySeconds = seconds
}
