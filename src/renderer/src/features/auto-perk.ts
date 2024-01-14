import { watch } from 'vue'

import { notify } from '@renderer/events/notifications'
import { accept } from '@renderer/http-api/matchmaking'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useAutoAcceptStore } from './stores/auto-accept'
import { useGameflowStore } from './stores/lcu/gameflow'
import { useSettingsStore } from './stores/settings'
import { onLcuEvent } from './update/lcu-events'

export const id = 'feature:auto-perk'

// 古幻想乡掌管自动设置符文的灵梦
export function setupAutoPerk() {
  const settings = useSettingsStore()
  const gameflowPhase = useGameflowStore()
  const autoAccept = useAutoAcceptStore()

  loadSettingsFromStorage()
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()
}
