import { is } from '@electron-toolkit/utils'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { BrowserWindow, shell } from 'electron'
import { makeAutoObservable } from 'mobx'
import { join } from 'path'

import icon from '../../../resources/LA_ICON.ico?asset'
import { createLogger } from './log'
import { displayAuxiliaryWindowTip } from './platform'

const logger = createLogger('auxiliary-window')

class AuxiliaryWindowState {
  state: 'normal' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  isShow: boolean = true

  isPinned: boolean = false

  isReady: boolean = false

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

export function setupAuxiliaryWindow() {
  ipcStateSync('auxiliary-window/state', () => auxiliaryWindowState.state)
  ipcStateSync('auxiliary-window/focus', () => auxiliaryWindowState.focus)
  ipcStateSync('auxiliary-window/is-show', () => auxiliaryWindowState.isShow)
  ipcStateSync('auxiliary-window/is-pinned', () => auxiliaryWindowState.isPinned)

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

  onRendererCall('auxiliary-window/show', (_, inactive) => {
    if (inactive) {
      auxiliaryWindow?.showInactive()
    } else {
      auxiliaryWindow?.show()
    }
  })

  onRendererCall('auxiliary-window/set-always-on-top', (_, flag, level, relativeLevel) => {
    auxiliaryWindow?.setAlwaysOnTop(flag, level, relativeLevel)
  })

  logger.info('初始化完成')
}
