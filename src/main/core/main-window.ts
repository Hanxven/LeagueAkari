import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'
import { makeAutoObservable } from 'mobx'
import { join } from 'node:path'

import icon from '../../../resources/LA_ICON.ico?asset'
import { ipcStateSync, onRendererCall, sendEventToRenderer } from '../utils/ipc'

class WindowState {
  state: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  constructor() {
    makeAutoObservable(this)
  }

  setState(s: 'normal' | 'maximized' | 'minimized') {
    this.state = s
  }

  setFocus(f: 'focused' | 'blurred' = 'focused') {
    this.focus = f
  }
}

export const windowState = new WindowState()

let mainWindow: BrowserWindow | null = null

export function getMainWindow() {
  return mainWindow
}

export function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 768,
    minWidth: 670,
    minHeight: 520,
    frame: false,
    show: false,
    title: 'League Akari',
    autoHideMenuBar: false,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  initMainWindow(mainWindow)

  // HMR
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 和窗口相关的 API
export function initMainWindow(w: BrowserWindow) {
  ipcStateSync('main-window/state', () => windowState.state)
  ipcStateSync('main-window/focus', () => windowState.focus)

  if (w.isMaximized()) {
    windowState.setState('maximized')
  } else if (w.isMinimized()) {
    windowState.setState('minimized')
  } else {
    windowState.setState('normal')
  }

  w.on('maximize', () => {
    windowState.setState('maximized')
  })

  w.on('unmaximize', () => {
    windowState.setState('normal')
  })

  w.on('minimize', () => {
    windowState.setState('minimized')
  })

  w.on('focus', () => {
    windowState.setFocus('focused')
  })

  w.on('blur', () => {
    windowState.setFocus('blurred')
  })

  onRendererCall('main-window/size/set', async (_e, width, height, animate) => {
    w.setSize(width, height, animate)
  })

  onRendererCall('main-window/size/get', async () => {
    return w.getSize()
  })

  onRendererCall('main-window/maximize', async () => {
    w.maximize()
  })

  onRendererCall('main-window/minimize', async () => {
    w.minimize()
  })

  onRendererCall('main-window/unmaximize', async () => {
    w.unmaximize()
  })

  onRendererCall('main-window/restore', async () => {
    w.restore()
  })

  onRendererCall('main-window/close', async () => {
    w.close()
  })

  onRendererCall('main-window/devtools/toggle', async () => {
    w.webContents.toggleDevTools()
  })

  onRendererCall('main-window/title/set', (_, title) => {
    w.setTitle(title)
  })

  onRendererCall('main-window/hide', () => {
    w.hide()
  })

  onRendererCall('main-window/show', (_, inactive) => {
    if (inactive) {
      w.showInactive()
    } else {
      w.show()
    }
  })

  onRendererCall('main-window/set-always-on-top', (_, flag, level, relativeLevel) => {
    w.setAlwaysOnTop(flag, level, relativeLevel)
  })

  w.on('page-title-updated', (e) => e.preventDefault())
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
