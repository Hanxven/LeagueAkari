import { is } from '@electron-toolkit/utils'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { BrowserWindow, shell } from 'electron'
import { makeAutoObservable } from 'mobx'
import { join } from 'path'

import icon from '../../../resources/LA_ICON.ico?asset'

class AuxiliaryWindowState {
  state: 'normal' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  isShow: boolean = true

  isPinned: boolean = false

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
}

export const auxiliaryWindowState = new AuxiliaryWindowState()

let auxiliaryWindow: BrowserWindow | null = null

export function getAuxiliaryWindow() {
  return auxiliaryWindow
}

export function createAuxiliaryWindow(): void {
  auxiliaryWindow = new BrowserWindow({
    width: 340,
    height: 600,
    minWidth: 340,
    maxWidth: 600,
    minHeight: 600,
    frame: false,
    show: false,
    title: 'Akaza Akari', // 这个窗口有一点阿卡林特性
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

  auxiliaryWindow.on('ready-to-show', () => {
    if (auxiliaryWindow) {
      auxiliaryWindow.show()
    }
  })

  auxiliaryWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  initAuxiliaryWindow(auxiliaryWindow)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    auxiliaryWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/auxiliary-window.html`)
  } else {
    auxiliaryWindow.loadFile(join(__dirname, '../renderer/auxiliary-window.html'))
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

export function initAuxiliaryWindow(w: BrowserWindow) {
  ipcStateSync('auxiliary-window/state', () => auxiliaryWindowState.state)
  ipcStateSync('auxiliary-window/focus', () => auxiliaryWindowState.focus)
  ipcStateSync('auxiliary-window/is-show', () => auxiliaryWindowState.isShow)
  ipcStateSync('auxiliary-window/is-pinned', () => auxiliaryWindowState.isPinned)

  if (w.isMinimized()) {
    auxiliaryWindowState.setState('minimized')
  } else {
    auxiliaryWindowState.setState('normal')
  }

  w.on('unmaximize', () => {
    auxiliaryWindowState.setState('normal')
  })

  w.on('minimize', () => {
    auxiliaryWindowState.setState('minimized')
  })

  w.on('restore', () => {
    auxiliaryWindowState.setState('normal')
  })

  w.on('focus', () => {
    auxiliaryWindowState.setFocus('focused')
  })

  w.on('blur', () => {
    auxiliaryWindowState.setFocus('blurred')
  })

  w.on('show', () => {
    auxiliaryWindowState.setShow(true)
  })

  w.on('hide', () => {
    auxiliaryWindowState.setShow(false)
  })

  auxiliaryWindowState.setPinned(w.isAlwaysOnTop())

  w.on('always-on-top-changed', (_, b) => {
    auxiliaryWindowState.setPinned(b)
  })

  onRendererCall('auxiliary-window/size/set', async (_e, width, height, animate) => {
    w.setSize(width, height, animate)
  })

  onRendererCall('auxiliary-window/size/get', async () => {
    return w.getSize()
  })

  onRendererCall('auxiliary-window/minimize', async () => {
    w.minimize()
  })

  onRendererCall('auxiliary-window/unmaximize', async () => {
    w.unmaximize()
  })

  onRendererCall('auxiliary-window/restore', async () => {
    w.restore()
  })

  onRendererCall('auxiliary-window/close', async () => {
    w.close()
  })

  onRendererCall('auxiliary-window/devtools/toggle', async () => {
    w.webContents.toggleDevTools()
  })

  onRendererCall('auxiliary-window/title/set', (_, title) => {
    w.setTitle(title)
  })

  onRendererCall('auxiliary-window/hide', () => {
    w.hide()
  })

  onRendererCall('auxiliary-window/show', (_, inactive) => {
    if (inactive) {
      w.showInactive()
    } else {
      w.show()
    }
  })

  onRendererCall('auxiliary-window/set-always-on-top', (_, flag, level, relativeLevel) => {
    w.setAlwaysOnTop(flag, level, relativeLevel)
  })

  w.on('page-title-updated', (e) => e.preventDefault())
}
