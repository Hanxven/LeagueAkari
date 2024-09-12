import { is } from '@electron-toolkit/utils'
import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'
import { BrowserWindow, Event, app, dialog, shell } from 'electron'
import { join } from 'node:path'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { AppModule } from '../app'
import { AuxWindowModule } from '../auxiliary-window'
import { AppLogger, LogModule } from '../log'
import { MainWindowState } from './state'

export class MainWindowModule extends MobxBasedBasicModule {
  private state = new MainWindowState()

  private _w: BrowserWindow | null = null

  private _appModule: AppModule
  private _logModule: LogModule
  private _awm: AuxWindowModule
  private _logger: AppLogger

  private _nextCloseAction: string | null = null
  private _willClose = false

  static INITIAL_SHOW = false
  static PARTITION = 'persist:main-window'
  static WINDOW_DEFAULT_SIZE = [1256, 780] as [number, number]
  static WINDOW_MIN_SIZE = [800, 600] as [number, number]

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

    await this._loadPreferences()
    this._setupStateSync()
    this._setupMethodCall()
    this._handleChores()

    app.on('before-quit', () => {
      this._nextCloseAction = 'quit'
    })

    this._logger.info('初始化完成')
  }

  /**
   * 一些杂项监听
   */
  private async _handleChores() {
    // 保存窗口大小，一秒内只保存一次
    this.reaction(
      () => this.state.windowSize,
      (size) => {
        size[0] = Math.max(size[0], MainWindowModule.WINDOW_MIN_SIZE[0])
        size[1] = Math.max(size[1], MainWindowModule.WINDOW_MIN_SIZE[1])
        this._ss.set('window-size', size)
      },
      { delay: 1000 }
    )
  }

  private async _loadPreferences() {
    this.state.setWindowSize(
      await this._ss.get('window-size', MainWindowModule.WINDOW_DEFAULT_SIZE)
    )
  }

  private _handleCloseMainWindow(event: Event) {
    if (this._willClose) {
      this._awm.closeWindow(true)
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
      this.restoreAndFocus()
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
    const [w, h] = this.state.windowSize
    const [minW, minH] = MainWindowModule.WINDOW_MIN_SIZE

    this._w = new BrowserWindow({
      width: w,
      height: h,
      minWidth: minW,
      minHeight: minH,
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
        partition: MainWindowModule.PARTITION
      }
    })

    this.state.setShow(MainWindowModule.INITIAL_SHOW)

    this._w.on('ready-to-show', () => {
      this.state.setReady(true)
      this._w?.show()
    })

    this._w.on('resize', () => {
      const size = this._w?.getSize()
      if (size) {
        this.state.setWindowSize(size as [number, number])
      }
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
      this.state.setWindowState('maximized')
    } else if (this._w.isMinimized()) {
      this.state.setWindowState('minimized')
    } else {
      this.state.setWindowState('normal')
    }

    this._w.on('maximize', () => {
      this.state.setWindowState('maximized')
    })

    this._w.on('unmaximize', () => {
      this.state.setWindowState('normal')
    })

    this._w.on('minimize', () => {
      this.state.setWindowState('minimized')
    })

    this._w.on('minimize', () => {
      this.state.setWindowState('minimized')
    })

    this._w.on('restore', () => {
      this.state.setWindowState('normal')
    })

    this._w.on('focus', () => {
      this.state.setFocusState('focused')
    })

    this._w.on('blur', () => {
      this.state.setFocusState('blurred')
    })

    this._w.on('close', (event) => {
      this._handleCloseMainWindow(event)
    })

    this._w.on('page-title-updated', (e) => e.preventDefault())

    this._w.webContents.setWindowOpenHandler((details) => {
      const response = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['是', '否'],
        defaultId: 0,
        title: '确认',
        message: `将跳转到外部链接 ${new URL(details.url).origin}`,
        detail: details.url
      })

      if (response === 0) {
        shell.openExternal(details.url)
      }

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
    this.propSync('state', this.state, ['windowState', 'focusState'])
    // this.propSync('state', this.state, 'focusState')
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
