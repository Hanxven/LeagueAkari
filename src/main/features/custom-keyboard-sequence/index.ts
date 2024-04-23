import { createLogger } from '@main/core/log'
import { pSendKey, pSendKeys, winPlatformEventBus } from '@main/core/platform'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { sleep } from '@shared/utils/sleep'

import { gameflow } from '../lcu-state-sync/gameflow'
import { customKeyboardSequenceState as cks } from './state'

let isSending = false

const logger = createLogger('custom-keyboard-sequence')

export async function setupCustomKeyboardSequence() {
  stateSync()
  ipcCall()
  await loadSettings()

  winPlatformEventBus.on('windows/global-key/delete', () => {
    if (cks.settings.enabled && gameflow.phase === 'InProgress') {
      if (isSending) {
        isSending = false
      } else {
        sendCustomSequence()
      }
    }
  })

  logger.info('初始化完成')
}

async function sendCustomSequence() {
  if (isSending) {
    return
  }

  isSending = true

  const texts = cks.settings.text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const tasks: (() => Promise<void>)[] = []
  for (let i = 0; i < texts.length; i++) {
    tasks.push(async () => {
      pSendKey(13, true)
      pSendKey(13, false)
      await sleep(65)
      pSendKeys(texts[i])
      await sleep(65)
      pSendKey(13, true)
      pSendKey(13, false)
    })

    if (i !== texts.length - 1) {
      tasks.push(() => sleep(65))
    }
  }

  for (const t of tasks) {
    if (isSending) {
      await t()
    }
  }

  isSending = false
}

function stateSync() {
  ipcStateSync('custom-keyboard-sequence/settings/enabled', () => cks.settings.enabled)
  ipcStateSync('custom-keyboard-sequence/settings/text', () => cks.settings.text)
}

function ipcCall() {
  onRendererCall('custom-keyboard-sequence/settings/enabled/set', async (_, enabled) => {
    cks.settings.setEnabled(enabled)
    await setSetting('custom-keyboard-sequence/enabled', enabled)
  })

  onRendererCall('custom-keyboard-sequence/settings/text/set', async (_, text) => {
    cks.settings.setText(text)
    await setSetting('custom-keyboard-sequence/text', text)
  })
}

async function loadSettings() {
  cks.settings.setEnabled(
    await getSetting('custom-keyboard-sequence/enabled', cks.settings.enabled)
  )

  cks.settings.setText(await getSetting('custom-keyboard-sequence/text', cks.settings.text))
}
