import { is } from '@electron-toolkit/utils'
import { i18next } from '@main/i18n'
import { AkariLogger } from '@main/shards/logger-factory'
import { SetterSettingService } from '@main/shards/setting-factory/setter-setting-service'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import { BrowserWindow, Event, dialog, shell } from 'electron'
import EventEmitter from 'node:events'
import path from 'node:path'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { MainWindowSettings, MainWindowState } from './state'

export class AkariMainWindow extends EventEmitter {
  static PARTITION = 'persist:main-window'
  static WINDOW_MIN_SIZE = [840, 600] as [number, number]
  static WINDOW_INITIAL_SHOW = false

  public readonly state = new MainWindowState()
  public readonly settings = new MainWindowSettings()

  private readonly _setting: SetterSettingService
  private readonly _log: AkariLogger

  private _window: BrowserWindow | null = null
  private _nextCloseAction: string | null = null
  private _forceClose = false

  /**
   * 子组成部分的 namespace, 应该是 window-manager/main-window
   */
  private _namespace: string

  get window() {
    return this._window
  }

  constructor(private _context: WindowManagerMainContext) {
    super()

    this._namespace = `${_context.namespace}/main-window`

    this._setting = _context.settingFactory.register(
      this._namespace,
      {
        closeAction: { default: this.settings.closeAction }
      },
      this.settings
    )
    this._log = _context.loggerFactory.create(this._namespace)
  }

  async onInit() {
    await this._setting.applyToState()

    this._context.mobx.propSync(this._namespace, 'state', this.state, [
      'status',
      'focus',
      'show',
      'ready'
    ])

    this._context.mobx.propSync(this._namespace, 'settings', this.settings, ['closeAction'])

    const windowSize = await this._setting._getFromStorage('size')
    if (windowSize) {
      this.state.setSize(windowSize)
    }

    this._handleObservations()
    this._handleIpcCall()
  }

  private _handleObservations() {
    this._context.mobx.reaction(
      () => this.state.size,
      (size) => {
        this._setting._saveToStorage('size', size)
      },
      { delay: 500 }
    )

    this._context.mobx.reaction(
      () => this._context.windowManager.settings.backgroundMaterial,
      (material) => {
        if (!this._window) {
          return
        }

        const m = this._context.windowManager._settingToNativeBackgroundMaterial(material)
        this._window.setBackgroundMaterial(m)
      },
      { fireImmediately: true }
    )
  }

  private _handleIpcCall() {
    this._context.ipc.onCall(this._namespace, 'setSize', async (_e, width, height, animate) => {
      this._window?.setSize(width, height, animate)
    })

    this._context.ipc.onCall(this._namespace, 'getSize', async () => {
      return this._window?.getSize()
    })

    this._context.ipc.onCall(this._namespace, 'maximize', async () => {
      this._window?.maximize()
    })

    this._context.ipc.onCall(this._namespace, 'minimize', async () => {
      this._window?.minimize()
    })

    this._context.ipc.onCall(this._namespace, 'unmaximize', async () => {
      this._window?.unmaximize()
    })

    this._context.ipc.onCall(this._namespace, 'restore', async () => {
      this._window?.restore()
    })

    this._context.ipc.onCall(this._namespace, 'close', async (strategy) => {
      this._nextCloseAction = strategy
      this._window?.close()
    })

    this._context.ipc.onCall(this._namespace, 'toggleDevtools', async () => {
      this._window?.webContents.toggleDevTools()
    })

    this._context.ipc.onCall(this._namespace, 'setTitle', (title) => {
      this._window?.setTitle(title)
    })

    this._context.ipc.onCall(this._namespace, 'hide', () => {
      this._window?.hide()
    })

    this._context.ipc.onCall(this._namespace, 'show', (inactive = false) => {
      this.showOrRestore(inactive)
    })

    this._context.ipc.onCall(this._namespace, 'setAlwaysOnTop', (flag, level, relativeLevel) => {
      this._window?.setAlwaysOnTop(flag, level, relativeLevel)
    })

    this._context.ipc.onCall(
      this._namespace,
      'openDialog',
      async (
        properties = ['openFile'],
        filters: {
          extensions: string[]
          name: string
        }[] = []
      ) => {
        if (!this._window) {
          return
        }

        const result = await dialog.showOpenDialog(this._window, {
          title: 'Select a file',
          properties,
          filters
        })

        return result.filePaths
      }
    )
  }

  showOrRestore(inactive = false) {
    if (this._window && this.state.ready) {
      if (!this.state.show) {
        if (inactive) {
          this._window.showInactive()
        } else {
          this._window.show()
        }

        return
      }

      if (this._window.isMinimized()) {
        this._window.restore()
      }
      this._window.focus()
    }
  }

  private _handleCloseWindow(event: Event) {
    if (this._forceClose) {
      this.emit('forceClose') // when main window is closed, close aux window
      return
    }

    const s = this._nextCloseAction || this.settings.closeAction

    if (s === 'minimize-to-tray') {
      event.preventDefault()
      this._window?.hide()
    } else if (s === 'ask') {
      event.preventDefault()

      if (!this.state.show) {
        this._window?.show()
      }

      this._context.ipc.sendEvent(this._namespace, 'close-asking')
      this.showOrRestore()
    } else {
      this.forceQuit()
      this._log.info('主窗口将关闭')
    }

    this._nextCloseAction = null
  }

  forceQuit() {
    if (this._window) {
      this._forceClose = true
      this._window.close()
    }
  }

  private _createWindow() {
    const [w, h] = this.state.size
    const [minW, minH] = AkariMainWindow.WINDOW_MIN_SIZE

    this._window = new BrowserWindow({
      width: w,
      height: h,
      minWidth: minW,
      minHeight: minH,
      frame: false,
      show: AkariMainWindow.WINDOW_INITIAL_SHOW,
      title: 'League Akari',
      autoHideMenuBar: false,
      icon,
      fullscreenable: false,
      backgroundMaterial: this._context.windowManager._settingToNativeBackgroundMaterial(
        this._context.windowManager.settings.backgroundMaterial
      ),
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false,
        partition: AkariMainWindow.PARTITION
      }
    })

    this.state.setShow(AkariMainWindow.WINDOW_INITIAL_SHOW)

    // 屏蔽一些不可控的快捷键, 会干扰到某些逻辑
    this._window.webContents.on('before-input-event', (event, input) => {
      if (
        (input.control && input.key.toLowerCase() === 'w') ||
        (input.control && input.key.toLowerCase() === 'r') ||
        (input.meta && input.key.toLowerCase() === 'r')
      ) {
        event.preventDefault()
      }
    })

    this._window.on('ready-to-show', () => {
      this.state.setReady(true)
      this._window?.show()
    })

    this._window.on('resize', () => {
      const size = this._window?.getSize()
      if (size) {
        this.state.setSize(size as [number, number])
      }
    })

    this._window.on('show', () => {
      this.state.setShow(true)
    })

    this._window.on('hide', () => {
      this.state.setShow(false)
    })

    this._window.on('closed', () => {
      this.state.setReady(false)
      this._window = null
      this._log.info('主窗口关闭')
    })

    if (this._window.isMaximized()) {
      this.state.setStatus('maximized')
    } else if (this._window.isMinimized()) {
      this.state.setStatus('minimized')
    } else {
      this.state.setStatus('normal')
    }

    this._window.on('maximize', () => {
      this.state.setStatus('maximized')
    })

    this._window.on('unmaximize', () => {
      this.state.setStatus('normal')
    })

    this._window.on('minimize', () => {
      this.state.setStatus('minimized')
    })

    this._window.on('minimize', () => {
      this.state.setStatus('minimized')
    })

    this._window.on('restore', () => {
      this.state.setStatus('normal')
    })

    this._window.on('focus', () => {
      this.state.setFocus('focused')
    })

    this._window.on('blur', () => {
      this.state.setFocus('blurred')
    })

    this._window.on('close', (event) => {
      this._handleCloseWindow(event)
    })

    this._window.on('page-title-updated', (e) => e.preventDefault())

    this._window.webContents.on('did-finish-load', () => {
      this._window?.webContents.setZoomFactor(1.0)
    })

    this._window.webContents.setWindowOpenHandler((details) => {
      dialog
        .showMessageBox(this._window!, {
          type: 'question',
          buttons: [i18next.t('common.yes'), i18next.t('common.no')],
          defaultId: 0,
          title: i18next.t('common.confirm'),
          message: details.url.startsWith(LEAGUE_AKARI_GITHUB)
            ? i18next.t('windowOpenHandler.toAkari')
            : i18next.t('windowOpenHandler.toExternalLink', {
                target: new URL(details.url).origin
              }),
          detail: details.url
        })
        .then((r) => {
          if (r.response === 0) {
            shell.openExternal(details.url)
          }
        })

      return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/main-window.html`)
    } else {
      this._window.loadFile(path.join(__dirname, '../renderer/main-window.html'))
    }

    this._log.info('创建主窗口')
  }

  createWindow() {
    if (!this._window || this._window.isDestroyed()) {
      this._createWindow()
    }
  }

  toggleDevtools() {
    this._window?.webContents.toggleDevTools()
  }

  toggleMinimizedAndFocused() {
    if (this._window) {
      if (!this.state.show) {
        this._window.show()
        this._window.focus()
        return
      }

      if (this._window.isMinimized()) {
        this._window.restore()
        this._window.focus()
      } else {
        this._window.minimize()
      }
    }
  }

  async onDispose() {}

  async onFinish() {
    this.createWindow()
  }
}
