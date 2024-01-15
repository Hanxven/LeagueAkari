import { useSettingsStore } from './stores/settings'

export const id = 'feature:auto-perk'

// 古幻想乡掌管自动设置符文的灵梦
// TODO under
export function setupAutoPerk() {
  loadSettingsFromStorage()
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()
}
