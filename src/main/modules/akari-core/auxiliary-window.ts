import { is } from '@electron-toolkit/utils'
import { lcuSyncModule as lcu } from '@main/modules/lcu-state-sync-new'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { BrowserWindow, Rectangle, screen, shell } from 'electron'
import { comparer, computed, makeAutoObservable, reaction } from 'mobx'
import { join } from 'path'

import icon from '../../../resources/LA_ICON.ico?asset'
import { appState } from './app'
import { lcuConnectionState } from './lcu-connection'
import { createLogger } from './log'
import { setAuxiliaryWindowTrayEnabled } from './platform'

const logger = createLogger('auxiliary-window')

const WINDOW_BASE_WIDTH = 300
const WINDOW_BASE_HEIGHT = 350

class AuxiliaryWindowSettings {
  opacity: number = 0.9

  enabled: boolean = true

  showSkinSelector: boolean = false

  zoomFactor: number = 1.0

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setEnabled(b: boolean) {
    this.enabled = b
  }

  setShowSkinSelector(b: boolean) {
    this.showSkinSelector = b
  }

  setZoomFactor(f: number) {
    this.zoomFactor = f
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

const INITIAL_SHOW = false

export function createAuxiliaryWindow() {
  if (auxiliaryWindow) {
    return
  }

  auxiliaryWindow = new BrowserWindow({
    width: WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor,
    height: WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor,
    minWidth: WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor,
    maxWidth: WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor,
    minHeight: WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor,
    maxHeight: WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor,
    resizable: false,
    frame: false,
    show: INITIAL_SHOW,
    title: 'Mini Akari',
    autoHideMenuBar: true,
    maximizable: false,
    minimizable: false,
    icon,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false,
      partition: 'persist:auxiliary-window'
    }
  })

  getLastWindowBounds().then((r) => {
    if (r) {
      adjustWindowSize(r.x, r.y)
    }
  })

  auxiliaryWindowState.setShow(INITIAL_SHOW)

  auxiliaryWindow.setOpacity(auxiliaryWindowState.settings.opacity)

  auxiliaryWindow.webContents.on('did-finish-load', () => {
    auxiliaryWindow?.webContents.setZoomFactor(auxiliaryWindowState.settings.zoomFactor)
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
      const bounds = auxiliaryWindow.getBounds()
      auxiliaryWindowState.setBounds(bounds)
    }
  })

  auxiliaryWindow.on('resize', () => {
    if (auxiliaryWindow) {
      const bounds = auxiliaryWindow.getBounds()
      auxiliaryWindowState.setBounds(bounds)
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

export function hideAuxiliaryWindow() {
  if (auxiliaryWindow && auxiliaryWindowState.isShow) {
    auxiliaryWindow.hide()
  }
}

export async function initAuxiliaryWindow() {
  ipcStateSync('auxiliary-window/state', () => auxiliaryWindowState.state)
  ipcStateSync('auxiliary-window/focus', () => auxiliaryWindowState.focus)
  ipcStateSync('auxiliary-window/is-show', () => auxiliaryWindowState.isShow)
  ipcStateSync('auxiliary-window/is-pinned', () => auxiliaryWindowState.isPinned)
  ipcStateSync('auxiliary-window/settings/opacity', () => auxiliaryWindowState.settings.opacity)
  ipcStateSync('auxiliary-window/settings/enabled', () => auxiliaryWindowState.settings.enabled)
  ipcStateSync(
    'auxiliary-window/settings/show-skin-selector',
    () => auxiliaryWindowState.settings.showSkinSelector
  )
  ipcStateSync(
    'auxiliary-window/settings/zoom-factor',
    () => auxiliaryWindowState.settings.zoomFactor
  )

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
    hideAuxiliaryWindow()
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

  onRendererCall('auxiliary-window/settings/show-skin-selector/set', async (_, s) => {
    auxiliaryWindowState.settings.setShowSkinSelector(s)
    await setSetting('auxiliary-window/show-skin-selector', s)
  })

  onRendererCall('auxiliary-window/settings/zoom-factor/set', async (_, f) => {
    auxiliaryWindowState.settings.setZoomFactor(f)
    await setSetting('auxiliary-window/zoom-factor', f)
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
    () => auxiliaryWindowState.settings.enabled,
    (e) => {
      if (e) {
        setAuxiliaryWindowTrayEnabled(true)
      } else {
        setAuxiliaryWindowTrayEnabled(false)
      }
    }
  )

  reaction(
    () => lcuConnectionState.state,
    (state) => {
      if (state !== 'connected') {
        hideAuxiliaryWindow()
      }
    }
  )

  const showPhase = computed(() => {
    switch (lcu.gameflow.phase) {
      case 'Matchmaking':
      case 'ReadyCheck':
      case 'Lobby':
        return 'lounge'
      case 'ChampSelect':
        return 'champ-select'
    }

    return 'no-activity'
  })

  reaction(
    () => [showPhase.get(), auxiliaryWindowState.isReady] as const,
    ([phase, b]) => {
      if (!b) {
        return
      }

      if (phase === 'no-activity') {
        hideAuxiliaryWindow()
      } else {
        showAuxiliaryWindow()
      }
    },
    { equals: comparer.shallow }
  )

  reaction(
    () => auxiliaryWindowState.settings.zoomFactor,
    () => {
      adjustWindowSize()
    }
  )

  auxiliaryWindowState.settings.setOpacity(
    await getSetting('auxiliary-window/opacity', auxiliaryWindowState.settings.opacity)
  )

  auxiliaryWindowState.settings.setEnabled(
    await getSetting('auxiliary-window/enabled', auxiliaryWindowState.settings.enabled)
  )

  auxiliaryWindowState.settings.setShowSkinSelector(
    await getSetting(
      'auxiliary-window/show-skin-selector',
      auxiliaryWindowState.settings.showSkinSelector
    )
  )

  auxiliaryWindowState.settings.setZoomFactor(
    await getSetting('auxiliary-window/zoom-factor', auxiliaryWindowState.settings.zoomFactor)
  )

  logger.info('初始化完成')
}

function getLastWindowBounds() {
  return getSetting<Rectangle | null>('auxiliary-window/bounds', null)
}

function saveWindowBounds(bounds: Rectangle) {
  bounds.width = WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor
  bounds.height = WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor
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
    const p = getCenteredRectangle(
      WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor,
      WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor
    )
    auxiliaryWindow.webContents.setZoomFactor(auxiliaryWindowState.settings.zoomFactor)
    auxiliaryWindow.setBounds({
      x: p.x,
      y: p.y,
      width: Math.ceil(WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor),
      height: Math.ceil(WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor)
    })
    logger.info('重置窗口位置到主显示器中心')
  }
}

function adjustWindowSize(x?: number, y?: number) {
  if (auxiliaryWindow) {
    auxiliaryWindow.webContents.setZoomFactor(auxiliaryWindowState.settings.zoomFactor)

    auxiliaryWindow.setMinimumSize(
      Math.ceil(WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor),
      Math.ceil(WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor)
    )
    auxiliaryWindow.setMaximumSize(
      Math.ceil(WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor),
      Math.ceil(WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor)
    )
    auxiliaryWindow.setBounds({
      x,
      y,
      width: Math.ceil(WINDOW_BASE_WIDTH * auxiliaryWindowState.settings.zoomFactor),
      height: Math.ceil(WINDOW_BASE_HEIGHT * auxiliaryWindowState.settings.zoomFactor)
    })

    saveWindowBounds(auxiliaryWindow.getBounds())
  }
}
