import { is } from '@electron-toolkit/utils'
import { MobxBasedModule } from '@main/akari-ipc/mobx-based-module'
import { BrowserWindow, Rectangle, screen, shell } from 'electron'
import { comparer, computed, makeAutoObservable } from 'mobx'
import { join } from 'path'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { LcuSyncModule } from '../lcu-state-sync'
import { AppModule } from './app'
import { LcuConnectionModule } from './lcu-connection'
import { AppLogger, LogModule } from './log'
import { StorageModule } from './storage'

class AuxiliaryWindowSettings {
  opacity: number = 0.9

  enabled: boolean = true

  showSkinSelector: boolean = false

  zoomFactor: number = 1.0

  taskbarIcon: boolean = true

  isPinned = true

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

  setTaskbarIcon(b: boolean) {
    this.taskbarIcon = b
  }

  constructor() {
    makeAutoObservable(this)
  }

  setPinned(pinned: boolean) {
    this.isPinned = pinned
  }
}

class AuxiliaryWindowState {
  state: 'normal' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  isShow: boolean = true

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

  setReady(ready: boolean) {
    this.isReady = ready
  }

  setBounds(bounds: Rectangle | null) {
    this.bounds = bounds
  }
}

export class AuxWindowModule extends MobxBasedModule {
  public state = new AuxiliaryWindowState()
  private _lcm: LcuConnectionModule
  private _lcu: LcuSyncModule
  private _logModule: LogModule
  private _sm: StorageModule
  private _logger: AppLogger
  private _appModule: AppModule

  private _w: BrowserWindow | null = null

  static INITIAL_SHOW = false
  static WINDOW_BASE_WIDTH = 300
  static WINDOW_BASE_HEIGHT = 350

  static PARTITION = 'persist:auxiliary-window'

  constructor() {
    super('auxiliary-window')
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._sm = this.manager.getModule<StorageModule>('storage')
    this._lcm = this.manager.getModule<LcuConnectionModule>('lcu-connection')
    this._lcu = this.manager.getModule<LcuSyncModule>('lcu-state-sync')
    this._appModule = this.manager.getModule<AppModule>('app')
    this._logger = this._logModule.createLogger('auxiliary-window')

    await this._loadSetting()
    this._setupStateSync()
    this._setupMethodCall()

    this._handleObservations()

    this._logger.info('初始化完成')
  }

  private _handleObservations() {
    const auxWindowShowTiming = computed(() => {
      switch (this._lcu.gameflow.phase) {
        case 'ChampSelect':
        case 'Lobby':
        case 'Matchmaking':
        case 'ReadyCheck':
          return 'show'
      }

      return 'hide'
    })

    this.autoDisposeReaction(
      () => auxWindowShowTiming.get(),
      (timing) => {
        if (timing === 'show') {
          this.showWindow()
        } else {
          this.hideWindow()
        }
      }
    )

    this.autoDisposeReaction(
      () => this.state.bounds,
      (bounds) => {
        if (bounds) {
          this._saveWindowBounds(bounds)
        }
      },
      { delay: 500, equals: comparer.shallow }
    )

    this.autoDisposeReaction(
      () => this.state.settings.opacity,
      (o) => {
        this._w?.setOpacity(o)
      },
      { fireImmediately: true }
    )

    this.autoDisposeReaction(
      () => [this.state.settings.enabled, this._appModule.state.ready] as const,
      ([enabled, ready]) => {
        if (!ready) {
          return
        }

        if (enabled) {
          this.createWindow()
        } else {
          this.closeWindow()
        }
      },
      { fireImmediately: true, delay: 500, equals: comparer.shallow }
    )

    this.autoDisposeReaction(
      () => this._lcm.state.state,
      (state) => {
        if (state !== 'connected') {
          this.hideWindow()
        }
      }
    )

    this.autoDisposeReaction(
      () => this.state.settings.zoomFactor,
      () => {
        this._adjustWindowSize()
      }
    )

    this.autoDisposeReaction(
      () => this.state.settings.taskbarIcon,
      (b) => {
        this._w?.setSkipTaskbar(!b)
        this._w?.setMinimizable(b)

        if (!b) {
          this._w?.show()
        }
      }
    )
  }

  private _setupStateSync() {
    this.simpleSync('state', () => this.state.state)
    this.simpleSync('focus', () => this.state.focus)
    this.simpleSync('is-show', () => this.state.isShow)
    this.simpleSync('settings/is-pinned', () => this.state.settings.isPinned)
    this.simpleSync('settings/opacity', () => this.state.settings.opacity)
    this.simpleSync('settings/enabled', () => this.state.settings.enabled)
    this.simpleSync('settings/show-skin-selector', () => this.state.settings.showSkinSelector)
    this.simpleSync('settings/zoom-factor', () => this.state.settings.zoomFactor)
    this.simpleSync('settings/taskbar-icon', () => this.state.settings.taskbarIcon)
  }

  private _setupMethodCall() {
    this.onCall('set-size', async (width, height, animate) => {
      this._w?.setSize(width, height, animate)
    })

    this.onCall('get-size', async () => {
      return this._w?.getSize()
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

    this.onCall('close', async () => {
      this._w?.close()
    })

    this.onCall('toggle-devtools', async () => {
      this._w?.webContents.toggleDevTools()
    })

    this.onCall('set-title', (title) => {
      this._w?.setTitle(title)
    })

    this.onCall('hide', () => {
      this.hideWindow()
    })

    this.onCall('show', (_) => {
      this.showWindow()
    })

    this.onCall('set-setting/opacity', async (opacity) => {
      this.state.settings.setOpacity(opacity)
      await this._sm.settings.set('auxiliary-window/opacity', opacity)
    })

    this.onCall('set-always-on-top', (flag, level, relativeLevel) => {
      this._w?.setAlwaysOnTop(flag, level, relativeLevel)
    })

    this.onCall('reset-window-position', () => {
      this.resetWindowPosition()
    })

    this.onCall('set-setting/enabled', async (enabled) => {
      this.state.settings.setEnabled(enabled)
      await this._sm.settings.set('auxiliary-window/enabled', enabled)
    })

    this.onCall('set-setting/show-skin-selector', async (s) => {
      this.state.settings.setShowSkinSelector(s)
      await this._sm.settings.set('auxiliary-window/show-skin-selector', s)
    })

    this.onCall('set-setting/zoom-factor', async (f) => {
      this.state.settings.setZoomFactor(f)
      await this._sm.settings.set('auxiliary-window/zoom-factor', f)
    })

    this.onCall('set-setting/taskbar-icon', async (b) => {
      this.state.settings.setTaskbarIcon(b)
      await this._sm.settings.set('auxiliary-window/taskbar-icon', b)
    })
  }

  createWindow() {
    if (!this._w || this._w.isDestroyed()) {
      this._createWindow()
    }
  }

  closeWindow() {
    if (this._w) {
      this._w.close()
      this._w = null

      if (!this._appModule.state.isQuitting) {
        this._logger.info('辅助窗口关闭')
      }
    }
  }

  showWindow() {
    if (this._w) {
      if (!this.state.isShow) {
        this._w.show()
      }
      this._w.focus()
    }
  }

  hideWindow() {
    if (this._w && this.state.isShow) {
      this._w.hide()
    }
  }

  private _createWindow() {
    this._w = new BrowserWindow({
      width: AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor,
      height: AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor,
      minWidth: AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor,
      maxWidth: AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor,
      minHeight: AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor,
      maxHeight: AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor,
      resizable: false,
      frame: false,
      show: AuxWindowModule.INITIAL_SHOW,
      title: 'Mini Akari',
      autoHideMenuBar: true,
      maximizable: false,
      minimizable: false,
      icon,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: this.state.settings.isPinned,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false,
        partition: AuxWindowModule.PARTITION
      }
    })

    this._getLastWindowBounds().then((r) => {
      if (r) {
        this._adjustWindowSize(r.x, r.y)
      }
    })

    this.state.setShow(AuxWindowModule.INITIAL_SHOW)

    this._w.setOpacity(this.state.settings.opacity)

    this._w.setSkipTaskbar(!this.state.settings.taskbarIcon)
    this._w.setMinimizable(this.state.settings.taskbarIcon)

    this._w.webContents.on('did-finish-load', () => {
      this._w?.webContents.setZoomFactor(this.state.settings.zoomFactor)
    })

    this._w.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    this._w.on('ready-to-show', () => {
      this.state.setReady(true)
    })

    if (this._w.isMinimized()) {
      this.state.setState('minimized')
    } else {
      this.state.setState('normal')
    }

    this._w.on('unmaximize', () => {
      this.state.setState('normal')
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

    this._w.on('show', () => {
      this.state.setShow(true)
    })

    this._w.on('hide', () => {
      this.state.setShow(false)
    })

    this._w.on('always-on-top-changed', (_, b) => {
      this._sm.settings.set('auxiliary-window/is-pinned', b)
      this.state.settings.setPinned(b)
    })

    this._w.on('closed', () => {
      this.state.setReady(false)
    })

    this._w.on('move', () => {
      if (this._w) {
        const bounds = this._w.getBounds()
        this.state.setBounds(bounds)
      }
    })

    this._w.on('resize', () => {
      if (this._w) {
        const bounds = this._w.getBounds()
        this.state.setBounds(bounds)
      }
    })

    this._w.on('page-title-updated', (e) => e.preventDefault())

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._w.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/auxiliary-window.html`)
    } else {
      this._w.loadFile(join(__dirname, '../renderer/auxiliary-window.html'))
    }

    this._logger.info('辅助窗口创建')
  }

  private async _loadSetting() {
    this.state.settings.setOpacity(
      await this._sm.settings.get('auxiliary-window/opacity', this.state.settings.opacity)
    )

    this.state.settings.setEnabled(
      await this._sm.settings.get('auxiliary-window/enabled', this.state.settings.enabled)
    )

    this.state.settings.setPinned(
      await this._sm.settings.get('auxiliary-window/is-pinned', this.state.settings.isPinned)
    )

    this.state.settings.setShowSkinSelector(
      await this._sm.settings.get(
        'auxiliary-window/show-skin-selector',
        this.state.settings.showSkinSelector
      )
    )

    this.state.settings.setZoomFactor(
      await this._sm.settings.get('auxiliary-window/zoom-factor', this.state.settings.zoomFactor)
    )

    this.state.settings.setTaskbarIcon(
      await this._sm.settings.get('auxiliary-window/taskbar-icon', this.state.settings.taskbarIcon)
    )
  }

  private _adjustWindowSize(x?: number, y?: number) {
    if (this._w) {
      this._w.webContents.setZoomFactor(this.state.settings.zoomFactor)

      if (!x || !y) {
        ;[x, y] = this._w.getPosition()
      }

      this._w.setBounds({
        x,
        y,
        width: Math.ceil(AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor),
        height: Math.ceil(AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor)
      })
      this._w.setMinimumSize(
        Math.ceil(AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor),
        Math.ceil(AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor)
      )
      this._w.setMaximumSize(
        Math.ceil(AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor),
        Math.ceil(AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor)
      )

      this._saveWindowBounds(this._w.getBounds())
    }
  }

  private _saveWindowBounds(bounds: Rectangle) {
    bounds.width = AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor
    bounds.height = AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor
    return this._sm.settings.set('auxiliary-window/bounds', bounds)
  }

  private async _getLastWindowBounds() {
    return this._sm.settings.get<Rectangle | null>('auxiliary-window/bounds', null)
  }

  private _getCenteredRectangle(width: number, height: number) {
    let { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

    let x = Math.round((screenWidth - width) / 2)
    let y = Math.round((screenHeight - height) / 2)

    return { x, y, width, height }
  }

  resetWindowPosition() {
    if (this._w) {
      const p = this._getCenteredRectangle(
        AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor,
        AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor
      )
      this._w.webContents.setZoomFactor(this.state.settings.zoomFactor)
      this._w.setBounds({
        x: p.x,
        y: p.y,
        width: Math.ceil(AuxWindowModule.WINDOW_BASE_WIDTH * this.state.settings.zoomFactor),
        height: Math.ceil(AuxWindowModule.WINDOW_BASE_HEIGHT * this.state.settings.zoomFactor)
      })
    }

    this._logger.info('重置辅助窗口位置到主显示器中心')
  }
}

export const auxWindowModule = new AuxWindowModule()
