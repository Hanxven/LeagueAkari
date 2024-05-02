import { is } from '@electron-toolkit/utils'
import { gameflow } from '@main/modules/lcu-state-sync/gameflow'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { BrowserWindow, Rectangle, screen, shell } from 'electron'
import { comparer, makeAutoObservable, reaction } from 'mobx'
import { join } from 'path'

import icon from '../../../resources/LA_ICON.ico?asset'
import { appState } from './app'
import { lcuConnectionState } from './lcu-connection'
import { createLogger } from './log'
import { displayAuxiliaryWindowTip } from './platform'

const logger = createLogger('auxiliary-window')

class AuxiliaryWindowSettings {
  opacity: number = 1

  enabled: boolean = true

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setEnabled(b: boolean) {
    this.enabled = b
  }

  constructor() {
    makeAutoObservable(this)
  }
}

class AuxiliaryWindowState {
  state: 'normal' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  isShow: boolean = true

  isPinned: boolean = false

  isReady: boolean = false

  bounds: Rectangle | null = null

  settings = new AuxiliaryWindowSettings()

  constructor() {
    makeAutoObservable(this)
  }

  setState(s: 'normal' | 'minimized') {
    this.state = s
  }

  setFocus(f: 'focused' | 'blurred' = 'focused') {
    this.focus = f
  }

  setShow(show: boolean) {
    this.isShow = show
  }

  setPinned(pinned: boolean) {
    this.isPinned = pinned
  }

  setReady(ready: boolean) {
    this.isReady = ready
  }

  setBounds(bounds: Rectangle | null) {
    this.bounds = bounds
  }
}

export const auxiliaryWindowState = new AuxiliaryWindowState()

let auxiliaryWindow: BrowserWindow | null = null

export function getAuxiliaryWindow() {
  return auxiliaryWindow
}

export function createAuxiliaryWindow(): void {
  if (auxiliaryWindow) {
    return
  }

  auxiliaryWindow = new BrowserWindow({
    width: 340,
    height: 440,
    minWidth: 340,
    maxWidth: 480,
    minHeight: 440,
    maxHeight: 600,
    frame: false,
    show: false,
    title: 'Mini Akari',
    autoHideMenuBar: true,
    maximizable: false,
    minimizable: false,
    icon,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false
    }
  })

  auxiliaryWindowState.setShow(false)
  auxiliaryWindowState.setBounds(auxiliaryWindow.getBounds())

  auxiliaryWindow.setOpacity(auxiliaryWindowState.settings.opacity)

  getLastWindowBounds().then((b) => {
    if (b && auxiliaryWindow) {
      auxiliaryWindow.setBounds(b)
    }
  })

  auxiliaryWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  auxiliaryWindow.on('ready-to-show', () => {
    auxiliaryWindowState.setReady(true)
  })

  if (auxiliaryWindow.isMinimized()) {
    auxiliaryWindowState.setState('minimized')
  } else {
    auxiliaryWindowState.setState('normal')
  }

  auxiliaryWindow.on('unmaximize', () => {
    auxiliaryWindowState.setState('normal')
  })

  auxiliaryWindow.on('minimize', () => {
    auxiliaryWindowState.setState('minimized')
  })

  auxiliaryWindow.on('restore', () => {
    auxiliaryWindowState.setState('normal')
  })

  auxiliaryWindow.on('focus', () => {
    auxiliaryWindowState.setFocus('focused')
  })

  auxiliaryWindow.on('blur', () => {
    auxiliaryWindowState.setFocus('blurred')
  })

  auxiliaryWindow.on('show', () => {
    auxiliaryWindowState.setShow(true)
  })

  auxiliaryWindow.on('hide', () => {
    auxiliaryWindowState.setShow(false)
  })

  auxiliaryWindowState.setPinned(auxiliaryWindow.isAlwaysOnTop())

  auxiliaryWindow.on('always-on-top-changed', (_, b) => {
    auxiliaryWindowState.setPinned(b)
  })

  auxiliaryWindow.on('closed', () => {
    auxiliaryWindowState.setReady(false)
  })

  auxiliaryWindow.on('move', () => {
    if (auxiliaryWindow) {
      auxiliaryWindowState.setBounds(auxiliaryWindow.getBounds())
    }
  })

  auxiliaryWindow.on('resize', () => {
    if (auxiliaryWindow) {
      auxiliaryWindowState.setBounds(auxiliaryWindow.getBounds())
    }
  })

  auxiliaryWindow.on('page-title-updated', (e) => e.preventDefault())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    auxiliaryWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/auxiliary-window.html`)
  } else {
    auxiliaryWindow.loadFile(join(__dirname, '../renderer/auxiliary-window.html'))
  }

  logger.info('Auxiliary Window 已创建')
}

export function closeAuxiliaryWindow() {
  if (auxiliaryWindow) {
    auxiliaryWindow.close()
    auxiliaryWindow = null
    logger.info('Auxiliary Window 关闭')
  }
}

export function showAuxiliaryWindow() {
  if (auxiliaryWindow) {
    if (!auxiliaryWindowState.isShow) {
      auxiliaryWindow.show()
    }
    auxiliaryWindow.focus()
  }
}

export function hideAuxiliaryWindow(isManually = false) {
  if (auxiliaryWindow && auxiliaryWindowState.isShow) {
    if (isManually) {
      displayAuxiliaryWindowTip()
    }
    auxiliaryWindow.hide()
  }
}

export async function setupAuxiliaryWindow() {
  ipcStateSync('auxiliary-window/state', () => auxiliaryWindowState.state)
  ipcStateSync('auxiliary-window/focus', () => auxiliaryWindowState.focus)
  ipcStateSync('auxiliary-window/is-show', () => auxiliaryWindowState.isShow)
  ipcStateSync('auxiliary-window/is-pinned', () => auxiliaryWindowState.isPinned)
  ipcStateSync('auxiliary-window/settings/opacity', () => auxiliaryWindowState.settings.opacity)
  ipcStateSync('auxiliary-window/settings/enabled', () => auxiliaryWindowState.settings.enabled)

  onRendererCall('auxiliary-window/size/set', async (_e, width, height, animate) => {
    auxiliaryWindow?.setSize(width, height, animate)
  })

  onRendererCall('auxiliary-window/size/get', async () => {
    return auxiliaryWindow?.getSize()
  })

  onRendererCall('auxiliary-window/minimize', async () => {
    auxiliaryWindow?.minimize()
  })

  onRendererCall('auxiliary-window/unmaximize', async () => {
    auxiliaryWindow?.unmaximize()
  })

  onRendererCall('auxiliary-window/restore', async () => {
    auxiliaryWindow?.restore()
  })

  onRendererCall('auxiliary-window/close', async () => {
    auxiliaryWindow?.close()
  })

  onRendererCall('auxiliary-window/devtools/toggle', async () => {
    auxiliaryWindow?.webContents.toggleDevTools()
  })

  onRendererCall('auxiliary-window/title/set', (_, title) => {
    auxiliaryWindow?.setTitle(title)
  })

  onRendererCall('auxiliary-window/hide', () => {
    hideAuxiliaryWindow(true)
  })

  onRendererCall('auxiliary-window/show', (_) => {
    showAuxiliaryWindow()
  })

  onRendererCall('auxiliary-window/settings/opacity/set', async (_, opacity) => {
    if (auxiliaryWindow) {
      auxiliaryWindowState.settings.setOpacity(opacity)
      await setSetting('auxiliary-window/opacity', opacity)
    }
  })

  onRendererCall('auxiliary-window/set-always-on-top', (_, flag, level, relativeLevel) => {
    auxiliaryWindow?.setAlwaysOnTop(flag, level, relativeLevel)
  })

  onRendererCall('auxiliary-window/reset-window-position', () => {
    resetWindowPosition()
  })

  onRendererCall('auxiliary-window/settings/enabled/set', async (_, enabled) => {
    auxiliaryWindowState.settings.setEnabled(enabled)
    await setSetting('auxiliary-window/enabled', enabled)
  })

  reaction(
    () => auxiliaryWindowState.bounds,
    (bounds) => {
      if (bounds) {
        saveWindowBounds(bounds)
      }
    },
    { delay: 500, equals: comparer.shallow }
  )

  reaction(
    () => auxiliaryWindowState.settings.opacity,
    (o) => {
      auxiliaryWindow?.setOpacity(o)
    },
    { fireImmediately: true }
  )

  // 在设置中启用小窗时的应对方法，如果不使用小窗会真正地关闭小窗（而不是暂时隐藏）
  reaction(
    () => [auxiliaryWindowState.settings.enabled, appState.ready] as const,
    ([enabled, ready]) => {
      if (!ready) {
        return
      }

      if (enabled) {
        createAuxiliaryWindow()
      } else {
        closeAuxiliaryWindow()
      }
    },
    { fireImmediately: true, delay: 500, equals: comparer.shallow }
  )

  reaction(
    () => lcuConnectionState.state,
    (state) => {
      if (state !== 'connected') {
        hideAuxiliaryWindow()
      }
    }
  )

  reaction(
    () => [gameflow.phase, auxiliaryWindowState.isReady] as const,
    ([phase, b]) => {
      if (!b) {
        return
      }

      switch (phase) {
        case 'Matchmaking':
        case 'ReadyCheck':
        case 'ChampSelect':
        case 'Lobby':
          showAuxiliaryWindow()
          return
      }

      hideAuxiliaryWindow()
    },
    { equals: comparer.shallow }
  )

  auxiliaryWindowState.settings.setOpacity(
    await getSetting('auxiliary-window/opacity', auxiliaryWindowState.settings.opacity)
  )

  logger.info('初始化完成')
}

function getLastWindowBounds() {
  return getSetting<Rectangle | null>('auxiliary-window/bounds', null)
}

function saveWindowBounds(bounds: Rectangle) {
  return setSetting('auxiliary-window/bounds', bounds)
}

function getCenteredRectangle(width: number, height: number) {
  let { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  let x = Math.round((screenWidth - width) / 2)
  let y = Math.round((screenHeight - height) / 2)

  return { x, y, width, height }
}

function resetWindowPosition() {
  if (auxiliaryWindow) {
    const b = auxiliaryWindow.getBounds()
    const p = getCenteredRectangle(b.width, b.height)
    auxiliaryWindow.setPosition(p.x, p.y)
    logger.info('重置窗口位置到主显示器中心')
  }
}
