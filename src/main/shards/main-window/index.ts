import { is } from '@electron-toolkit/utils'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { BrowserWindow, dialog, shell } from 'electron'
import { join } from 'node:path'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { AppCommonMain } from '../app-common'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { MainWindowState } from './state'

export class MainWindowMain implements IAkariShardInitDispose {
  static id = 'main-window-main'
  static dependencies = [
    'mobx-utils-main',
    'app-common-main',
    'logger-factory-main',
    'setting-factory-main'
  ]

  static INITIAL_SHOW = false
  static PARTITION = 'persist:main-window'
  static WINDOW_DEFAULT_SIZE = [1256, 780] as [number, number]
  static WINDOW_MIN_SIZE = [800, 600] as [number, number]

  public readonly state = new MainWindowState()

  private readonly _common: AppCommonMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger
  private readonly _mobx: MobxUtilsMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _setting: MobxSettingService

  private _w: BrowserWindow | null = null

  private _nextCloseAction: string | null = null
  private _willClose = false

  constructor(deps: any) {
    this._common = deps['app-common-main']
    this._loggerFactory = deps['logger-factory-main']
    this._mobx = deps['mobx-utils-main']
    this._settingFactory = deps['setting-factory-main']
    this._log = this._loggerFactory.create(MainWindowMain.id)
    this._setting = this._settingFactory.create(MainWindowMain.PARTITION, {}, {})
  }

  async onInit() {
    const savedSize = await this._setting._getFromStorage(
      'window-size',
      MainWindowMain.WINDOW_DEFAULT_SIZE
    )
    this.state.setWindowSize(savedSize)
    this._handleWindowSizeTrack()
  }

  private _handleCloseEvent(event: Event) {
    if (this._willClose) {
      // this._awm.closeWindow(true)
      return
    }

    if (!this._w) {
      return
    }

    const s = this._nextCloseAction || this._common.state.settings.mainWindowCloseStrategy

    if (s === 'minimize-to-tray') {
      event.preventDefault()
      this._w.hide()
    } else if (s === 'unset') {
      event.preventDefault()

      if (!this.state.isShow) {
        this._w.show()
      }

      // this._ipc.sendEvent(MainWindowMain.id, 'close-asking')
      this.restoreAndFocus()
    } else {
      this._willClose = true
      this._w.close()

      this._log.info('MainWindow Close -> 将关闭主窗口')
    }

    this._nextCloseAction = null
  }

  private _handleWindowSizeTrack() {
    this._mobx.reaction(
      () => this.state.windowSize,
      (size) => {
        size[0] = Math.max(size[0], MainWindowMain.WINDOW_MIN_SIZE[0])
        size[1] = Math.max(size[1], MainWindowMain.WINDOW_MIN_SIZE[1])
        this._setting._saveToStorage('windowSize', size)
      },
      { delay: 500 }
    )
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

  private _createWindow() {
    const [w, h] = this.state.windowSize
    const [minW, minH] = MainWindowMain.WINDOW_MIN_SIZE

    this._w = new BrowserWindow({
      width: w,
      height: h,
      minWidth: minW,
      minHeight: minH,
      frame: false,
      show: MainWindowMain.INITIAL_SHOW,
      title: 'League Akari',
      autoHideMenuBar: false,
      icon,
      fullscreenable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false,
        partition: MainWindowMain.PARTITION
      }
    })

    this.state.setShow(MainWindowMain.INITIAL_SHOW)

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
      this._handleCloseEvent(event as any)
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

    this._log.info('创建窗口')
  }

  createWindow() {
    if (!this._w || this._w.isDestroyed()) {
      this._createWindow()
    }
  }
}
