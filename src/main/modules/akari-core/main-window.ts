import { is } from '@electron-toolkit/utils'
import { MobxBasedModule } from '@shared/akari/mobx-based-module'
import { BrowserWindow, Event, app, shell } from 'electron'
import { makeAutoObservable } from 'mobx'
import { join } from 'node:path'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { AppModule } from './app'
import { AuxWindowModule } from './auxiliary-window'
import { AppLogger, LogModule } from './log'

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

export class MainWindowModule extends MobxBasedModule {
  private state = new MainWindowState()

  private _w: BrowserWindow | null = null

  private _appModule: AppModule
  private _logModule: LogModule
  private _awm: AuxWindowModule
  private _logger: AppLogger

  private _nextCloseAction: string | null = null
  private _willClose = false

  static INITIAL_SHOW = false

  constructor() {
    super('main-window')

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this._createWindow()
      }
    })
  }

  override async setup() {
    await super.setup()

    this._appModule = this.manager.getModule<AppModule>('app')
    this._logModule = this.manager.getModule<LogModule>('log')
    this._awm = this.manager.getModule<AuxWindowModule>('auxiliary-window')
    this._logger = this._logModule.createLogger('main-window')

    this._setupStateSync()
    this._setupMethodCall()

    app.on('before-quit', () => {
      this._nextCloseAction = 'quit'
    })

    this._logger.info('初始化完成')
  }

  private _handleCloseMainWindow(event: Event) {
    if (this._willClose) {
      this._awm.closeWindow()
      return
    }

    const s = this._nextCloseAction || this._appModule.state.settings.closeStrategy

    if (s === 'minimize-to-tray') {
      event.preventDefault()
      this._w?.hide()
    } else if (s === 'unset') {
      event.preventDefault()

      if (!this.state.isShow) {
        this._w?.show()
      }

      this.sendEvent('close-asking')
    } else {
      this._willClose = true
      this._w?.close()

      if (!this._appModule.state.isQuitting) {
        this._logger.info('主窗口关闭')
      }
    }

    this._nextCloseAction = null
  }

  createWindow() {
    if (!this._w || this._w.isDestroyed()) {
      this._createWindow()
    }
  }

  private _createWindow() {
    this._w = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 520,
      frame: false,
      show: MainWindowModule.INITIAL_SHOW,
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

    this.state.setShow(MainWindowModule.INITIAL_SHOW)

    this._w.on('ready-to-show', () => {
      this.state.setReady(true)
      this._w?.show()
    })

    this._w.on('show', () => {
      this.state.setShow(true)
    })

    this._w.on('hide', () => {
      this.state.setShow(false)
    })

    this._w.on('closed', () => {
      this.state.setReady(false)
    })

    if (this._w.isMaximized()) {
      this.state.setState('maximized')
    } else if (this._w.isMinimized()) {
      this.state.setState('minimized')
    } else {
      this.state.setState('normal')
    }

    this._w.on('maximize', () => {
      this.state.setState('maximized')
    })

    this._w.on('unmaximize', () => {
      this.state.setState('normal')
    })

    this._w.on('minimize', () => {
      this.state.setState('minimized')
    })

    this._w.on('minimize', () => {
      this.state.setState('minimized')
    })

    this._w.on('restore', () => {
      this.state.setState('normal')
    })

    this._w.on('focus', () => {
      this.state.setFocus('focused')
    })

    this._w.on('blur', () => {
      this.state.setFocus('blurred')
    })

    this._w.on('close', (event) => {
      this._handleCloseMainWindow(event)
    })

    this._w.on('page-title-updated', (e) => e.preventDefault())

    this._w.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._w.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/main-window.html`)
    } else {
      this._w.loadFile(join(__dirname, '../renderer/main-window.html'))
    }

    this._logger.info('创建主窗口')
  }

  private _setupStateSync() {
    this.simpleSync('state', () => this.state.state)
    this.simpleSync('focus', () => this.state.focus)
  }

  private _setupMethodCall() {
    this.onCall('set-size', async (_e, width, height, animate) => {
      this._w?.setSize(width, height, animate)
    })

    this.onCall('get-size', async () => {
      return this._w?.getSize()
    })

    this.onCall('maximize', async () => {
      this._w?.maximize()
    })

    this.onCall('minimize', async () => {
      this._w?.minimize()
    })

    this.onCall('unmaximize', async () => {
      this._w?.unmaximize()
    })

    this.onCall('restore', async () => {
      this._w?.restore()
    })

    this.onCall('close', async (strategy) => {
      this._nextCloseAction = strategy
      this._w?.close()
    })

    this.onCall('toggle-devtools', async () => {
      this._w?.webContents.toggleDevTools()
    })

    this.onCall('set-title', (title) => {
      this._w?.setTitle(title)
    })

    this.onCall('hide', () => {
      this._w?.hide()
    })

    this.onCall('show', (inactive) => {
      if (inactive) {
        this._w?.showInactive()
      } else {
        this._w?.show()
      }
    })

    this.onCall('set-always-on-top', (flag, level, relativeLevel) => {
      this._w?.setAlwaysOnTop(flag, level, relativeLevel)
    })
  }

  get mainWindow() {
    return this._w
  }

  get notify() {
    return this._notificationMap
  }

  show() {
    this._w?.show()
  }

  restoreAndFocus() {
    if (this._w) {
      if (!this.state.isShow) {
        this._w.show()
        this._w.focus()
        return
      }

      if (this._w.isMinimized()) {
        this._w.restore()
      }

      this._w.focus()
    }
  }

  toggleMinimizedAndFocused() {
    if (this._w) {
      if (!this.state.isShow) {
        this._w.show()
        this._w.focus()
        return
      }

      if (this._w.isMinimized()) {
        this._w.restore()
        this._w.focus()
      } else {
        this._w.minimize()
      }
    }
  }

  private _notificationMap = {
    success: (module: string, title: string, content: string, id?: string) => {
      this._mwNotificationE('success', module, title, content, id)
    },

    warn: (module: string, title: string, content: string, id?: string) => {
      this._mwNotificationE('warning', module, title, content, id)
    },

    info: (module: string, title: string, content: string, id?: string) => {
      this._mwNotificationE('info', module, title, content, id)
    },

    error: (module: string, title: string, content: string, id?: string) => {
      this._mwNotificationE('error', module, title, content, id)
    }
  }

  /**
   * 给主窗口发送通知事件
   */
  private _mwNotificationE(
    type: string,
    module: string,
    title: string,
    content: string,
    id?: string
  ) {
    if (this._w) {
      this.sendEvent('notification', { type, module, title, content, id })
    }
  }
}

export const mainWindowModule = new MainWindowModule()
