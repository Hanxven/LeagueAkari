import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'
import { makeAutoObservable } from 'mobx'
import { join } from 'node:path'

import icon from '../../../resources/LA_ICON.ico?asset'
import { ipcStateSync, onRendererCall, sendEventToRenderer } from '../utils/ipc'
import { appState } from './app'
import { getAuxiliaryWindow } from './auxiliary-window'
import { createLogger } from './log'

const logger = createLogger('main-window')

class MainWindowState {
  state: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  ready: boolean = false

  isShow: boolean = true

  constructor() {
    makeAutoObservable(this)
  }

  setState(s: 'normal' | 'maximized' | 'minimized') {
    this.state = s
  }

  setFocus(f: 'focused' | 'blurred' = 'focused') {
    this.focus = f
  }

  setShow(show: boolean) {
    this.isShow = show
  }

  setReady(ready: boolean) {
    this.ready = ready
  }
}

export const mainWindowState = new MainWindowState()

let mainWindow: BrowserWindow | null = null

export function getMainWindow() {
  return mainWindow
}

export function restoreAndFocus() {
  if (mainWindow) {
    if (!mainWindowState.isShow) {
      mainWindow.show()
      mainWindow.focus()
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
}

export function toggleMinimizeAndFocus() {
  if (mainWindow) {
    if (!mainWindowState.isShow) {
      mainWindow.show()
      mainWindow.focus()
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
      mainWindow.focus()
    } else {
      mainWindow.minimize()
    }
  }
}

const INITIAL_SHOW = false

export function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 520,
    frame: false,
    show: INITIAL_SHOW,
    title: 'League Akari',
    autoHideMenuBar: false,
    icon,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false,
      partition: 'persist:main-window'
    }
  })

  mainWindowState.setShow(INITIAL_SHOW)

  mainWindow.on('ready-to-show', () => {
    mainWindowState.setReady(true)

    if (mainWindow) {
      mainWindow.show()
    }
  })

  mainWindow.on('show', () => mainWindowState.setShow(true))

  mainWindow.on('hide', () => mainWindowState.setShow(false))

  mainWindow.on('closed', () => {
    mainWindowState.setReady(false)
  })

  if (mainWindow.isMaximized()) {
    mainWindowState.setState('maximized')
  } else if (mainWindow.isMinimized()) {
    mainWindowState.setState('minimized')
  } else {
    mainWindowState.setState('normal')
  }

  mainWindow.on('maximize', () => {
    mainWindowState.setState('maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindowState.setState('normal')
  })

  mainWindow.on('minimize', () => {
    mainWindowState.setState('minimized')
  })

  mainWindow.on('restore', () => {
    mainWindowState.setState('normal')
  })

  mainWindow.on('focus', () => {
    mainWindowState.setFocus('focused')
  })

  mainWindow.on('blur', () => {
    mainWindowState.setFocus('blurred')
  })

  mainWindow.on('page-title-updated', (e) => e.preventDefault())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/main-window.html`)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/main-window.html'))
  }

  logger.info('Main Window 已创建')
}

export function setupMainWindow() {
  ipcStateSync('main-window/state', () => mainWindowState.state)
  ipcStateSync('main-window/focus', () => mainWindowState.focus)

  onRendererCall('main-window/size/set', async (_e, width, height, animate) => {
    mainWindow?.setSize(width, height, animate)
  })

  onRendererCall('main-window/size/get', async () => {
    return mainWindow?.getSize()
  })

  onRendererCall('main-window/maximize', async () => {
    mainWindow?.maximize()
  })

  onRendererCall('main-window/minimize', async () => {
    mainWindow?.minimize()
  })

  onRendererCall('main-window/unmaximize', async () => {
    mainWindow?.unmaximize()
  })

  onRendererCall('main-window/restore', async () => {
    mainWindow?.restore()
  })

  onRendererCall('main-window/close', async (_, strategy) => {
    const s = strategy || appState.settings.closeStrategy
    
    if (s === 'minimize-to-tray' || s === 'unset') {
      mainWindow?.hide()
      return
    }

    const auxWindow = getAuxiliaryWindow()
    if (auxWindow) {
      auxWindow.close()
    }

    mainWindow?.close()
  })

  onRendererCall('main-window/devtools/toggle', async () => {
    mainWindow?.webContents.toggleDevTools()
  })

  onRendererCall('main-window/title/set', (_, title) => {
    mainWindow?.setTitle(title)
  })

  onRendererCall('main-window/hide', () => {
    mainWindow?.hide()
  })

  onRendererCall('main-window/show', (_, inactive) => {
    if (inactive) {
      mainWindow?.showInactive()
    } else {
      mainWindow?.show()
    }
  })

  onRendererCall('main-window/set-always-on-top', (_, flag, level, relativeLevel) => {
    mainWindow?.setAlwaysOnTop(flag, level, relativeLevel)
  })

  logger.info('初始化完成')
}

/**
 * 将通知消息发送到主窗口
 * @param module 来自模块
 * @param title 标题
 * @param content 内容
 * @param id 额外附加的 id，用于特殊标识
 */
function mwNotificationE(
  type: string,
  module: string,
  title: string,
  content: string,
  id?: string
) {
  if (mainWindow) {
    sendEventToRenderer(mainWindow.webContents, 'main-window/notification', {
      type,
      module,
      title,
      content,
      id
    })
  }
}

export const mwNotification = {
  success(module: string, title: string, content: string, id?: string) {
    mwNotificationE('success', module, title, content, id)
  },
  warn(module: string, title: string, content: string, id?: string) {
    mwNotificationE('warning', module, title, content, id)
  },
  info(module: string, title: string, content: string, id?: string) {
    mwNotificationE('info', module, title, content, id)
  },
  error(module: string, title: string, content: string, id?: string) {
    mwNotificationE('error', module, title, content, id)
  }
}
