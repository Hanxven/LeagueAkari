import { is } from '@electron-toolkit/utils'
import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'
import { BrowserWindow, Rectangle, dialog, screen, shell } from 'electron'
import { comparer, computed, makeAutoObservable, observable } from 'mobx'
import { join } from 'path'

import icon from '../../../../resources/LA_ICON.ico?asset'
import opggIcon from '../../../../resources/OPGG_ICON.ico?asset'
import { LcuSyncModule } from '../lcu-state-sync'
import { AppModule } from './app'
import { LcuConnectionModule } from './lcu-connection'
import { AppLogger, LogModule } from './log'

class AuxiliaryWindowSettings {
  opacity: number = 0.9

  enabled: boolean = true

  showSkinSelector: boolean = false

  zoomFactor: number = 1.0

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

  constructor() {
    makeAutoObservable(this)
  }

  setPinned(pinned: boolean) {
    this.isPinned = pinned
  }
}

class AuxiliaryWindowState {
  windowState: 'normal' | 'minimized' = 'normal'

  focusState: 'focused' | 'blurred' = 'focused'

  isShow: boolean = true

  isReady: boolean = false

  /**
   * 同步大小状态以持久化
   */
  bounds: Rectangle | null = null

  /**
   * 根据小窗充当的功能，记录功能窗口的位置
   */
  functionalityBounds: Record<string, Partial<Rectangle>> = {}

  /**
   * 小窗口当前充当的功能
   */
  currentFunctionality: 'indicator' | 'opgg' = 'indicator'

  settings = new AuxiliaryWindowSettings()

  constructor() {
    makeAutoObservable(this, {
      bounds: observable.ref,
      functionalityBounds: observable.ref
    })
  }

  setWindowState(s: 'normal' | 'minimized') {
    this.windowState = s
  }

  setFocusState(f: 'focused' | 'blurred' = 'focused') {
    this.focusState = f
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

  setFunctionality(f: 'indicator' | 'opgg') {
    this.currentFunctionality = f
  }

  setFunctionalityBounds(fb: Record<string, Partial<Rectangle>>) {
    this.functionalityBounds = fb
  }
}

export class AuxWindowModule extends MobxBasedBasicModule {
  static WINDOW_OPGG_DEFAULT_WIDTH = 526
  static WINDOW_OPGG_DEFAULT_HEIGHT = 720

  public state = new AuxiliaryWindowState()
  private _lcm: LcuConnectionModule
  private _lcu: LcuSyncModule
  private _logModule: LogModule
  private _logger: AppLogger
  private _appModule: AppModule

  private _w: BrowserWindow | null = null

  private _isForceClose = false

  static INITIAL_SHOW = false
  static WINDOW_BASE_WIDTH = 300
  static WINDOW_BASE_HEIGHT = 350

  static WINDOW_OPGG_BASE_WIDTH = 480
  static WINDOW_OPGG_BASE_HEIGHT = 720

  static PARTITION = 'persist:auxiliary-window'

  constructor() {
    super('auxiliary-window')
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._lcm = this.manager.getModule<LcuConnectionModule>('lcu-connection')
    this._lcu = this.manager.getModule<LcuSyncModule>('lcu-state-sync')
    this._appModule = this.manager.getModule<AppModule>('app')
    this._logger = this._logModule.createLogger('auxiliary-window')

    await this._setupSettingsSync()
    await this._loadPreferences()
    this._setupStateSync()
    this._setupMethodCall()

    this._handleObservations()

    this._logger.info('初始化完成')
  }

  private _handleObservations() {
    const auxWindowIndicatorShowTiming = computed(() => {
      switch (this._lcu.gameflow.phase) {
        case 'ChampSelect':
        case 'Lobby':
        case 'Matchmaking':
        case 'ReadyCheck':
          return 'show'
      }

      return 'hide'
    })

    const auxWindowOpggShowTiming = computed(() => {
      switch (this._lcu.gameflow.phase) {
        case 'ChampSelect':
          return 'show'
      }

      return 'normal'
    })

    // normally show & hide
    this.autoDisposeReaction(
      () => auxWindowIndicatorShowTiming.get(),
      (timing) => {
        if (this.state.currentFunctionality !== 'indicator') {
          return
        }

        if (timing === 'show') {
          this.showWindow()
        } else {
          this.hideWindow()
        }
      }
    )

    // shows only in champ select and never hides
    this.autoDisposeReaction(
      () => auxWindowOpggShowTiming.get(),
      (timing) => {
        if (this.state.currentFunctionality !== 'opgg') {
          return
        }

        if (timing === 'show') {
          this.showWindow()
        }
      }
    )

    this.autoDisposeReaction(
      () => this.state.bounds,
      (bounds) => {
        if (bounds) {
          const currentFunctionality = this.state.currentFunctionality
          if (currentFunctionality) {
            this.state.setFunctionalityBounds({
              ...this.state.functionalityBounds,
              [currentFunctionality]: bounds
            })
            this._ss.set('functionality-bounds', this.state.functionalityBounds)
          }
        }
      },
      { delay: 250, equals: comparer.shallow }
    )

    this.autoDisposeReaction(
      () => this.state.currentFunctionality,
      (f) => {
        this._ss.set('functionality', f)
      }
    )

    this.autoDisposeReaction(
      () => this.state.settings.zoomFactor,
      (f) => {
        this._w?.webContents.setZoomFactor(f)
      }
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
  }

  private _setupStateSync() {
    this.sync(this.state, this.id, 'windowState')
    this.sync(this.state, this.id, 'focusState')
    this.sync(this.state, this.id, 'isShow')
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

    this.onCall('reset-window-position', () => {
      this.resetWindowPosition()
    })

    this.onCall('set-window-size', (width, height) => {
      this._w?.setSize(width, height)
    })

    this.onCall('get-window-size', () => {
      const [width, height] = this._w?.getSize() || []
      return { width, height }
    })

    this.onCall('set-functionality', (f: 'indicator' | 'opgg') => {
      this._adjustForFunctionality(f)
    })

    this.onCall('get-functionality', () => {
      return this.state.currentFunctionality
    })
  }

  private _adjustForFunctionality(f: 'indicator' | 'opgg') {
    let bounds: Partial<Rectangle> = this.state.functionalityBounds[f]

    switch (f) {
      case 'indicator':
        if (bounds) {
          bounds = {
            ...bounds,
            width: Math.max(bounds.width || 0, AuxWindowModule.WINDOW_BASE_WIDTH),
            height: Math.max(bounds.height || 0, AuxWindowModule.WINDOW_BASE_HEIGHT)
          }
        } else {
          bounds = {
            width: AuxWindowModule.WINDOW_BASE_WIDTH,
            height: AuxWindowModule.WINDOW_BASE_HEIGHT
          }
        }

        this._w?.setMinimumSize(
          AuxWindowModule.WINDOW_BASE_WIDTH,
          AuxWindowModule.WINDOW_BASE_HEIGHT
        )
        this._w?.setTitle('Mini Akari')
        this._w?.setBounds(bounds)
        this._w?.setIcon(icon)
        break
      case 'opgg':
        if (bounds) {
          bounds = {
            ...bounds,
            width: Math.max(bounds.width || 0, AuxWindowModule.WINDOW_OPGG_DEFAULT_WIDTH),
            height: Math.max(bounds.height || 0, AuxWindowModule.WINDOW_OPGG_DEFAULT_HEIGHT)
          }
        } else {
          bounds = {
            width: AuxWindowModule.WINDOW_OPGG_DEFAULT_WIDTH,
            height: AuxWindowModule.WINDOW_OPGG_DEFAULT_HEIGHT
          }
        }

        this._w?.setMinimumSize(
          AuxWindowModule.WINDOW_OPGG_BASE_WIDTH,
          AuxWindowModule.WINDOW_OPGG_BASE_HEIGHT
        )
        this._w?.setTitle('OP.GG Akari')
        this._w?.setBounds(bounds)
        this._w?.setIcon(opggIcon)
        break
      default:
        this._w?.setTitle('Vanished Akari')
        return
    }

    this.state.setFunctionality(f)
  }

  createWindow() {
    if (!this._w || this._w.isDestroyed()) {
      this._createWindow()
    }
  }

  closeWindow(force = false) {
    if (this._w) {
      this._isForceClose = true
      this._w.close()
      this._w = null

      if (!this._appModule.state.isQuitting) {
        this._logger.info('辅助窗口关闭')
      }
    }
  }

  showWindow() {
    if (this._w) {
      this._w.show()
      this._w.focus()
    }
  }

  hideWindow() {
    if (this._w && this.state.isShow) {
      this._w.hide()
    }
  }

  get auxWindow() {
    return this._w
  }

  private _createWindow() {
    this._w = new BrowserWindow({
      width: AuxWindowModule.WINDOW_BASE_WIDTH,
      height: AuxWindowModule.WINDOW_BASE_HEIGHT,
      minWidth: AuxWindowModule.WINDOW_BASE_WIDTH,
      minHeight: AuxWindowModule.WINDOW_BASE_HEIGHT,
      resizable: true,
      frame: false,
      show: AuxWindowModule.INITIAL_SHOW,
      title: 'Mini Akari',
      autoHideMenuBar: true,
      maximizable: false,
      minimizable: true,
      icon,
      fullscreenable: false,
      skipTaskbar: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false,
        partition: AuxWindowModule.PARTITION
      }
    })

    this.state.setShow(AuxWindowModule.INITIAL_SHOW)

    this._adjustForFunctionality(this.state.currentFunctionality)

    this.state.setBounds(this._w.getBounds())

    this._w.setOpacity(this.state.settings.opacity)

    this._w.setAlwaysOnTop(this.state.settings.isPinned, 'normal')

    this._w.webContents.on('did-finish-load', () => {
      this._w?.webContents.setZoomFactor(this.state.settings.zoomFactor)
    })

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

    this._w.on('ready-to-show', () => {
      this.state.setReady(true)
    })

    if (this._w.isMinimized()) {
      this.state.setWindowState('minimized')
    } else {
      this.state.setWindowState('normal')
    }

    this._w.on('unmaximize', () => {
      this.state.setWindowState('normal')
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

    this._w.on('show', () => {
      this.state.setShow(true)
    })

    this._w.on('hide', () => {
      this.state.setShow(false)
    })

    this._w.on('always-on-top-changed', (_, b) => {
      this._ss.set('is-pinned', b)
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

    this._w.on('close', (e) => {
      if (this._isForceClose) {
        this._isForceClose = false
        return
      }

      e.preventDefault()
      this.hideWindow()
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._w.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/auxiliary-window.html`)
    } else {
      this._w.loadFile(join(__dirname, '../renderer/auxiliary-window.html'))
    }

    this._logger.info('辅助窗口创建')
  }

  private async _loadPreferences() {
    this.state.setFunctionalityBounds(
      await this._ss.get('functionality-bounds', this.state.functionalityBounds)
    )
    this.state.setFunctionality(await this._ss.get('functionality', 'indicator'))
  }

  private async _setupSettingsSync() {
    this.simpleSettingSync(
      'opacity',
      () => this.state.settings.opacity,
      (s) => this.state.settings.setOpacity(s)
    )
    this.simpleSettingSync(
      'enabled',
      () => this.state.settings.enabled,
      (s) => this.state.settings.setEnabled(s)
    )
    this.simpleSettingSync(
      'is-pinned',
      () => this.state.settings.isPinned,
      async (s, ss) => {
        this._w?.setAlwaysOnTop(s, 'normal')
        this.state.settings.setPinned(s)
        await ss.set('is-pinned', s)

        return true
      }
    )
    this.simpleSettingSync(
      'show-skin-selector',
      () => this.state.settings.showSkinSelector,
      (s) => this.state.settings.setShowSkinSelector(s)
    )
    this.simpleSettingSync(
      'zoom-factor',
      () => this.state.settings.zoomFactor,
      (s) => this.state.settings.setZoomFactor(s)
    )

    await this.loadSettings()
  }

  private _getCenteredRectangle(width: number, height: number) {
    let { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

    let x = Math.round((screenWidth - width) / 2)
    let y = Math.round((screenHeight - height) / 2)

    return { x, y, width, height }
  }

  resetWindowPosition() {
    if (this._w) {
      const bounds = this._w.getBounds()
      const p = this._getCenteredRectangle(
        bounds.width * this.state.settings.zoomFactor,
        bounds.height * this.state.settings.zoomFactor
      )
      this._w.webContents.setZoomFactor(this.state.settings.zoomFactor)
      this._w.setPosition(p.x, p.y)
    }

    this._logger.info('重置辅助窗口位置到主显示器中心')
  }
}

export const auxWindowModule = new AuxWindowModule()
