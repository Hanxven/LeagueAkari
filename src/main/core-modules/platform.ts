import { onRendererCall, sendEventToAllRenderer, sendEventToRenderer } from '@main/utils/ipc'
import { Menu, MenuItem, Notification, Tray, app } from 'electron'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import { randomUUID } from 'node:crypto'
import EventEmitter from 'node:events'
import { Worker } from 'node:worker_threads'

import icon from '../../../resources/LA_ICON.ico?asset'
import sendInputWorker from '../workers/send-input?nodeWorker'
import { showAuxiliaryWindow } from './auxiliary-window'
import { createLogger } from './log'
import { restoreAndFocus, toggleMinimizeAndFocus } from './main-window'

export const winPlatformEventBus = new EventEmitter()

const gkl = new GlobalKeyboardListener()

const logger = createLogger('windows-platform')

let siw: Worker | null = null

let tray: Tray

let showAuxiliaryWindowMenuItem: MenuItem | null = null

// 和平台相关的 API，目前仅限 Windows
export function initWindowsPlatform() {
  tray = new Tray(icon)

  showAuxiliaryWindowMenuItem = new MenuItem({
    label: '展示小窗',
    type: 'normal',
    click: () => {
      showAuxiliaryWindow()
    }
  })

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'League Akari',
      type: 'normal',
      click: () => {
        restoreAndFocus()
      }
    },
    {
      type: 'separator'
    },
    showAuxiliaryWindowMenuItem,
    {
      label: '退出',
      type: 'normal',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('League Akari')
  tray.setContextMenu(contextMenu)
  tray.addListener('click', () => {
    toggleMinimizeAndFocus()
  })

  // 系统级别的通知事件，暂未实装
  onRendererCall('windows/notify', (event, options) => {
    options.id = options.id || randomUUID()

    const notification = new Notification({ ...options })

    notification.on('click', () => {
      winPlatformEventBus.emit('notification/click', options.id)
      sendEventToRenderer(event.sender, 'notification/click', options.id)
    })

    notification.on('close', () => {
      winPlatformEventBus.emit('notification/close', options.id)
      sendEventToRenderer(event.sender, 'notification/close', options.id)
    })

    notification.show()
  })

  siw = sendInputWorker({})

  onRendererCall('windows/send-key', (_, key, pressed) => {
    siw?.postMessage({ type: 'key', key, press: pressed })
  })

  onRendererCall('windows/send-keys', (_, str) => {
    siw?.postMessage({ type: 'string', data: str })
  })

  let pageUpShortcut = false
  let pageDownShortcut = false
  let deleteShortcut = false

  gkl.addListener((event) => {
    if (event.state === 'DOWN') {
      if (event.name === 'PAGE UP') {
        pageUpShortcut = true
      } else if (event.name === 'PAGE DOWN') {
        pageDownShortcut = true
      } else if (event.name === 'DELETE') {
        deleteShortcut = true
      }
    }

    if (event.state === 'UP') {
      if (event.name === 'PAGE UP' && pageUpShortcut) {
        pageUpShortcut = false
        winPlatformEventBus.emit('windows/global-key/page-up')
        sendEventToAllRenderer('windows/global-key/page-up')
      } else if (event.name === 'PAGE DOWN' && pageDownShortcut) {
        pageDownShortcut = false
        winPlatformEventBus.emit('windows/global-key/page-down')
        sendEventToAllRenderer('windows/global-key/page-down')
      } else if (event.name === 'DELETE' && deleteShortcut) {
        deleteShortcut = false
        winPlatformEventBus.emit('windows/global-key/delete')
        sendEventToAllRenderer('windows/global-key/delete')
      }
    }
  })

  app.on('before-quit', () => {
    siw?.terminate()
    gkl.kill()
  })

  logger.info('初始化完成')
}

export function pSendKey(key: number, pressed: boolean) {
  if (siw) {
    siw.postMessage({ type: 'key', key, press: pressed })
  }
}

export function pSendKeys(str: string) {
  if (siw) {
    siw.postMessage({ type: 'string', data: str })
  }
}

let auxiliaryWindowTipShowed = false

export function displayAuxiliaryWindowTip() {
  if (auxiliaryWindowTipShowed) {
    return
  }

  if (tray) {
    tray.displayBalloon({
      title: 'League Akari',
      content: '辅助小窗仍可在托盘区图标还原',
      respectQuietTime: true,
      noSound: true,
      iconType: 'custom',
      icon: icon
    })
    auxiliaryWindowTipShowed = true
  }
}

export function setAuxiliaryWindowTrayEnabled(enabled: boolean) {
  if (showAuxiliaryWindowMenuItem) {
    showAuxiliaryWindowMenuItem.enabled = enabled
  }
}
