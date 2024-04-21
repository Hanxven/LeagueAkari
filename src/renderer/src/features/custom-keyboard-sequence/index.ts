import { mainCall, mainStateSync } from '@renderer/utils/ipc'

import { useCustomKeyboardSequenceStore } from './store'

export async function setupCustomKeyboardSequence() {
  const cks = useCustomKeyboardSequenceStore()

  mainStateSync('custom-keyboard-sequence/settings/enabled', (s) => (cks.settings.enabled = s))
  mainStateSync('custom-keyboard-sequence/settings/text', (s) => (cks.settings.text = s))
}

export function setCksEnabled(enabled: boolean) {
  return mainCall('custom-keyboard-sequence/settings/enabled/set', enabled)
}

export function setCksText(text: string) {
  return mainCall('custom-keyboard-sequence/settings/text/set', text)
}
