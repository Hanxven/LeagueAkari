import { is } from '@electron-toolkit/utils'
import { i18next } from '@main/i18n'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AkariSharedGlobalShard, SHARED_GLOBAL_ID } from '@shared/akari-shard/manager'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import { BrowserWindow, Event, Rectangle, dialog, screen, shell } from 'electron'
import { comparer, computed } from 'mobx'
import { join } from 'node:path'

import icon from '../../../../resources/LA_ICON.ico?asset'
import opggIcon from '../../../../resources/OPGG_ICON.ico?asset'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { WindowManagerSettings, WindowManagerState } from './state'

export class WindowManagerMain implements IAkariShardInitDispose {
  static id = 'window-manager-main'
  static dependencies = [
    SHARED_GLOBAL_ID,
    'akari-ipc-main',
    'mobx-utils-main',
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main'
  ]

  static MAIN_WINDOW_DEFAULT_SIZE = [1310, 862] as [number, number]
  static MAIN_WINDOW_MIN_SIZE = [800, 600] as [number, number]
  static MAIN_WINDOW_INITIAL_SHOW = false
  static MAIN_WINDOW_PARTITION = 'persist:main-window'

  static AUX_WINDOW_INITIAL_SHOW = false
  static AUX_WINDOW_BASE_WIDTH = 340
  static AUX_WINDOW_BASE_HEIGHT = 420

  static AUX_WINDOW_OPGG_BASE_WIDTH = 480
  static AUX_WINDOW_OPGG_BASE_HEIGHT = 720
  static AUX_WINDOW_OPGG_DEFAULT_WIDTH = 526
  static AUX_WINDOW_OPGG_DEFAULT_HEIGHT = 720

  static AUX_WINDOW_PARTITION = 'persist:aux-window'

  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain
  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService
  private readonly _lc: LeagueClientMain
  private readonly _shared: AkariSharedGlobalShard

  /**
   * 标记位, 用于判断是否是即将退出应用程序 (需要全部窗口关闭)
   */
  private _willQuit = false

  private _nextCloseAction: string | null = null

  private _mw: BrowserWindow | null = null
  private _aw: BrowserWindow | null = null

  public readonly settings = new WindowManagerSettings()
  public readonly state = new WindowManagerState()

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._mobx = deps['mobx-utils-main']
    this._shared = deps[SHARED_GLOBAL_ID]
    this._log = deps['logger-factory-main'].create(WindowManagerMain.id)
    this._setting = deps['setting-factory-main'].create(
      WindowManagerMain.id,
      {
        auxWindowEnabled: { default: this.settings.auxWindowEnabled },
        mainWindowCloseAction: { default: this.settings.mainWindowCloseAction },
        auxWindowAutoShow: { default: this.settings.auxWindowAutoShow },
        auxWindowOpacity: { default: this.settings.auxWindowOpacity },
        auxWindowPinned: { default: this.settings.auxWindowPinned },
        auxWindowShowSkinSelector: { default: this.settings.auxWindowShowSkinSelector }
      },
      this.settings
    )
    this._lc = deps['league-client-main']
  }

  async onInit() {
    await this._setting.applyToState()

    if (this._shared.global.isWindows11_22H2_OrHigher) {
      this.state.setSupportsMica(true)
    }

    this._mobx.propSync(WindowManagerMain.id, 'state', this.state, [
      'mainWindowFocus',
      'mainWindowShow',
      'mainWindowStatus',
      'auxWindowFocus',
      'auxWindowReady',
      'auxWindowFunctionality',
      'auxWindowStatus'
    ])

    this._mobx.propSync(WindowManagerMain.id, 'settings', this.settings, [
      'mainWindowCloseAction',
      'auxWindowEnabled',
      'auxWindowAutoShow',
      'auxWindowOpacity',
      'auxWindowPinned',
      'auxWindowShowSkinSelector'
    ])

    this._setting.onChange('auxWindowPinned', (value, { setter }) => {
      if (this._aw) {
        this._aw.setAlwaysOnTop(value, 'normal')
      }
      setter()
    })

    const auxFBounds = await this._setting._getFromStorage('auxWindowFunctionalityBounds')
    if (auxFBounds) {
      this.state.setAuxWindowFunctionalityBounds(auxFBounds)
    }

    const auxFunctionality = await this._setting._getFromStorage('auxWindowFunctionality')
    if (auxFunctionality) {
      this.state.setAuxWindowFunctionality(auxFunctionality)
    }

    const mainWindowSize = await this._setting._getFromStorage('mainWindowSize')
    if (mainWindowSize) {
      this.state.setMainWindowSize(mainWindowSize)
    }

    this._handleAuxWindowObservations()
    this._handleMainWindowObservations()
    this._handleMainWindowIpcCall()
    this._handleAuxWindowIpcCall()
  }

  private _handleMainWindowIpcCall() {
    this._ipc.onCall(
      WindowManagerMain.id,
      'main-window/setSize',
      async (_e, width, height, animate) => {
        this._mw?.setSize(width, height, animate)
      }
    )

    this._ipc.onCall(WindowManagerMain.id, 'main-window/getSize', async () => {
      return this._mw?.getSize()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/maximize', async () => {
      this._mw?.maximize()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/minimize', async () => {
      this._mw?.minimize()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/unmaximize', async () => {
      this._mw?.unmaximize()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/restore', async () => {
      this._mw?.restore()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/close', async (strategy) => {
      this._nextCloseAction = strategy
      this._mw?.close()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/toggleDevtools', async () => {
      this._mw?.webContents.toggleDevTools()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/setTitle', (title) => {
      this._mw?.setTitle(title)
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/hide', () => {
      this._mw?.hide()
    })

    this._ipc.onCall(WindowManagerMain.id, 'main-window/show', (inactive = false) => {
      this.showOrRestoreMainWindow(inactive)
    })

    this._ipc.onCall(
      WindowManagerMain.id,
      'main-window/setAlwaysOnTop',
      (flag, level, relativeLevel) => {
        this._mw?.setAlwaysOnTop(flag, level, relativeLevel)
      }
    )

    this._ipc.onCall(WindowManagerMain.id, 'main-window/setBackgroundMaterial', (material) => {
      this._mw?.setBackgroundMaterial(material)
    })

    this._ipc.onCall(
      WindowManagerMain.id,
      'main-window/openDialog',
      async (
        properties = ['openFile'],
        filters: {
          extensions: string[]
          name: string
        }[] = []
      ) => {
        if (!this._mw) {
          return
        }

        const result = await dialog.showOpenDialog(this._mw, {
          title: 'Select a file',
          properties,
          filters
        })

        return result.filePaths
      }
    )
  }

  private _handleAuxWindowIpcCall() {
    this._ipc.onCall(WindowManagerMain.id, 'aux-window/setSize', async (width, height, animate) => {
      this._aw?.setSize(width, height, animate)
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/getSize', async () => {
      return this._aw?.getSize()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/minimize', async () => {
      this._aw?.minimize()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/unmaximize', async () => {
      this._aw?.unmaximize()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/restore', async () => {
      this._aw?.restore()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/close', async () => {
      this._aw?.close()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/toggleDevtools', async () => {
      this._aw?.webContents.toggleDevTools()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/setTitle', (title) => {
      this._aw?.setTitle(title)
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/hide', () => {
      this.hideAuxWindow()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/show', (inactive: boolean = false) => {
      this.showOrRestoreAuxWindow(inactive)
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/resetWindowPosition', () => {
      this.resetAuxWindowPosition()
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/setWindowSize', (width, height) => {
      this._aw?.setSize(width, height)
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/getWindowSize', () => {
      const [width, height] = this._aw?.getSize() || []
      return { width, height }
    })

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/setBackgroundMaterial', (material) => {
      this._aw?.setBackgroundMaterial(material)
    })

    this._ipc.onCall(
      WindowManagerMain.id,
      'aux-window/setFunctionality',
      (f: 'indicator' | 'opgg') => {
        this._adjustAuxWindowForFunctionality(f)
      }
    )

    this._ipc.onCall(WindowManagerMain.id, 'aux-window/getFunctionality', () => {
      return this.state.auxWindowFunctionality
    })
  }

  showOrRestoreAuxWindow(inactive = false) {
    if (this._aw && this.state.auxWindowReady) {
      if (!this.state.auxWindowShow) {
        if (inactive) {
          this._aw.showInactive()
        } else {
          this._aw.show()
        }

        return
      }

      if (this._aw.isMinimized()) {
        this._aw.restore()
      }
      this._aw.focus()
    }
  }

  hideAuxWindow() {
    if (this._aw && this.state.auxWindowShow) {
      this._aw.hide()
    }
  }

  private _adjustAuxWindowForFunctionality(f: 'indicator' | 'opgg') {
    let bounds: Partial<Rectangle> = this.state.auxWindowFunctionalityBounds[f]

    switch (f) {
      case 'indicator':
        if (bounds) {
          bounds = {
            ...bounds,
            width: Math.max(bounds.width || 0, WindowManagerMain.AUX_WINDOW_BASE_WIDTH),
            height: Math.max(bounds.height || 0, WindowManagerMain.AUX_WINDOW_BASE_HEIGHT)
          }
        } else {
          bounds = {
            width: WindowManagerMain.AUX_WINDOW_BASE_WIDTH,
            height: WindowManagerMain.AUX_WINDOW_BASE_HEIGHT
          }
        }

        this._aw?.setMinimumSize(
          WindowManagerMain.AUX_WINDOW_BASE_WIDTH,
          WindowManagerMain.AUX_WINDOW_BASE_HEIGHT
        )
        this._aw?.setTitle('Mini Akari')
        this._aw?.setBounds(bounds)
        this._aw?.setIcon(icon)
        break
      case 'opgg':
        if (bounds) {
          bounds = {
            ...bounds,
            width: Math.max(bounds.width || 0, WindowManagerMain.AUX_WINDOW_OPGG_DEFAULT_WIDTH),
            height: Math.max(bounds.height || 0, WindowManagerMain.AUX_WINDOW_OPGG_DEFAULT_HEIGHT)
          }
        } else {
          bounds = {
            width: WindowManagerMain.AUX_WINDOW_OPGG_DEFAULT_WIDTH,
            height: WindowManagerMain.AUX_WINDOW_OPGG_DEFAULT_HEIGHT
          }
        }

        this._aw?.setMinimumSize(
          WindowManagerMain.AUX_WINDOW_OPGG_BASE_WIDTH,
          WindowManagerMain.AUX_WINDOW_OPGG_BASE_HEIGHT
        )
        this._aw?.setTitle('OP.GG Akari')
        this._aw?.setBounds(bounds)
        this._aw?.setIcon(opggIcon)
        break
      default:
        this._aw?.setTitle('Vanished Akari')
        return
    }

    this.state.setAuxWindowFunctionality(f)
  }

  /**
   * 主窗口一旦关闭, 应用程序即关闭 (但可以隐藏不显示)
   * @param event
   * @returns
   */
  private _handleCloseMainWindow(event: Event) {
    if (this._willQuit) {
      this._aw?.close()
      return
    }

    const s = this._nextCloseAction || this.settings.mainWindowCloseAction

    if (s === 'minimize-to-tray') {
      event.preventDefault()
      this._mw?.hide()
    } else if (s === 'ask') {
      event.preventDefault()

      if (!this.state.mainWindowShow) {
        this._mw?.show()
      }

      this._ipc.sendEvent(WindowManagerMain.id, 'main-window-close-asking')
      this.showOrRestoreMainWindow()
    } else {
      this._willQuit = true
      this._mw?.close()
      this._log.info('主窗口将关闭')
    }

    this._nextCloseAction = null
  }

  private _createMainWindow() {
    const [w, h] = this.state.mainWindowSize
    const [minW, minH] = WindowManagerMain.MAIN_WINDOW_MIN_SIZE

    this._mw = new BrowserWindow({
      width: w,
      height: h,
      minWidth: minW,
      minHeight: minH,
      frame: false,
      show: WindowManagerMain.MAIN_WINDOW_INITIAL_SHOW,
      title: 'League Akari',
      autoHideMenuBar: false,
      icon,
      fullscreenable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        backgroundThrottling: false,
        partition: WindowManagerMain.MAIN_WINDOW_PARTITION
      }
    })

    this.state.setMainWindowShow(WindowManagerMain.MAIN_WINDOW_INITIAL_SHOW)

    // 屏蔽一些不可控的快捷键, 会干扰到某些逻辑
    this._mw.webContents.on('before-input-event', (event, input) => {
      if (
        (input.control && input.key.toLowerCase() === 'w') ||
        (input.control && input.key.toLowerCase() === 'r') ||
        (input.meta && input.key.toLowerCase() === 'r')
      ) {
        event.preventDefault()
      }
    })

    this._mw.on('ready-to-show', () => {
      this.state.setMainWindowReady(true)
      this._mw?.show()
    })

    this._mw.on('resize', () => {
      const size = this._mw?.getSize()
      if (size) {
        this.state.setMainWindowSize(size as [number, number])
      }
    })

    this._mw.on('show', () => {
      this.state.setMainWindowShow(true)
    })

    this._mw.on('hide', () => {
      this.state.setMainWindowShow(false)
    })

    this._mw.on('closed', () => {
      this.state.setMainWindowReady(false)
      this._mw = null
    })

    if (this._mw.isMaximized()) {
      this.state.setMainWindowStatus('maximized')
    } else if (this._mw.isMinimized()) {
      this.state.setMainWindowStatus('minimized')
    } else {
      this.state.setMainWindowStatus('normal')
    }

    this._mw.on('maximize', () => {
      this.state.setMainWindowStatus('maximized')
    })

    this._mw.on('unmaximize', () => {
      this.state.setMainWindowStatus('normal')
    })

    this._mw.on('minimize', () => {
      this.state.setMainWindowStatus('minimized')
    })

    this._mw.on('minimize', () => {
      this.state.setMainWindowStatus('minimized')
    })

    this._mw.on('restore', () => {
      this.state.setMainWindowStatus('normal')
    })

    this._mw.on('focus', () => {
      this.state.setMainWindowFocus('focused')
    })

    this._mw.on('blur', () => {
      this.state.setMainWindowFocus('blurred')
    })

    this._mw.on('close', (event) => {
      this._handleCloseMainWindow(event)
    })

    this._mw.on('page-title-updated', (e) => e.preventDefault())

    this._mw.webContents.on('did-finish-load', () => {
      this._aw?.webContents.setZoomFactor(1.0)
    })

    this._mw.webContents.setWindowOpenHandler((details) => {
      dialog
        .showMessageBox(this._mw!, {
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
      this._mw.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/main-window.html`)
    } else {
      this._mw.loadFile(join(__dirname, '../renderer/main-window.html'))
    }

    this._log.info('创建主窗口')
  }

  private _createAuxWindow() {
    this._aw = new BrowserWindow({
      width: WindowManagerMain.AUX_WINDOW_BASE_WIDTH,
      height: WindowManagerMain.AUX_WINDOW_BASE_HEIGHT,
      minWidth: WindowManagerMain.AUX_WINDOW_BASE_WIDTH,
      minHeight: WindowManagerMain.AUX_WINDOW_BASE_HEIGHT,
      resizable: true,
      frame: false,
      show: WindowManagerMain.AUX_WINDOW_INITIAL_SHOW,
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
        partition: WindowManagerMain.AUX_WINDOW_PARTITION
      }
    })

    this._aw.webContents.on('before-input-event', (event, input) => {
      if (
        (input.control && input.key.toLowerCase() === 'w') ||
        (input.control && input.key.toLowerCase() === 'r') ||
        (input.meta && input.key.toLowerCase() === 'r')
      ) {
        event.preventDefault()
      }
    })

    this.state.setAuxWindowShow(WindowManagerMain.AUX_WINDOW_INITIAL_SHOW)

    this._adjustAuxWindowForFunctionality(this.state.auxWindowFunctionality)

    this.state.setAuxWindowBounds(this._aw.getBounds())

    this._aw.setOpacity(this.settings.auxWindowOpacity)

    this._aw.setAlwaysOnTop(this.settings.auxWindowPinned, 'normal')

    this._aw.webContents.on('did-finish-load', () => {
      this._aw?.webContents.setZoomFactor(1.0)
    })

    this._aw.webContents.setWindowOpenHandler((details) => {
      dialog
        .showMessageBox(this._aw!, {
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

    this._aw.on('ready-to-show', () => {
      this.state.setAuxWindowReady(true)
    })

    if (this._aw.isMinimized()) {
      this.state.setAuxWindowStatus('minimized')
    } else {
      this.state.setAuxWindowStatus('normal')
    }

    this._aw.on('unmaximize', () => {
      this.state.setAuxWindowStatus('normal')
    })

    this._aw.on('minimize', () => {
      this.state.setAuxWindowStatus('minimized')
    })

    this._aw.on('restore', () => {
      this.state.setAuxWindowStatus('normal')
    })

    this._aw.on('focus', () => {
      this.state.setAuxWindowFocus('focused')
    })

    this._aw.on('blur', () => {
      this.state.setAuxWindowFocus('blurred')
    })

    this._aw.on('show', () => {
      this.state.setAuxWindowShow(true)
    })

    this._aw.on('hide', () => {
      this.state.setAuxWindowShow(false)
    })

    this._aw.on('always-on-top-changed', (_, b) => {
      this._setting.set('auxWindowPinned', b)
    })

    this._aw.on('closed', () => {
      this.state.setAuxWindowReady(false)
      this._aw = null
    })

    this._aw.on('move', () => {
      if (this._aw) {
        const bounds = this._aw.getBounds()
        this.state.setAuxWindowBounds(bounds)
      }
    })

    this._aw.on('resize', () => {
      if (this._aw) {
        const bounds = this._aw.getBounds()
        this.state.setAuxWindowBounds(bounds)
      }
    })

    this._aw.on('page-title-updated', (e) => e.preventDefault())

    this._aw.on('close', (e) => {
      if (this._willQuit) {
        return
      }

      e.preventDefault()
      this.hideAuxWindow()
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._aw.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/aux-window.html`)
    } else {
      this._aw.loadFile(join(__dirname, '../renderer/aux-window.html'))
    }

    this._log.info('创建辅助窗口')
  }

  closeAuxWindow() {
    if (this._aw) {
      this._aw.close()
      this._aw = null

      this._log.info('辅助窗口关闭')
    }
  }

  resetAuxWindowPosition() {
    if (this._aw) {
      switch (this.state.auxWindowFunctionality) {
        case 'indicator':
          this._aw.setSize(
            WindowManagerMain.AUX_WINDOW_BASE_WIDTH,
            WindowManagerMain.AUX_WINDOW_BASE_HEIGHT
          )
          break
        case 'opgg':
          this._aw.setSize(
            WindowManagerMain.AUX_WINDOW_OPGG_DEFAULT_WIDTH,
            WindowManagerMain.AUX_WINDOW_OPGG_DEFAULT_HEIGHT
          )
      }

      const bounds = this._aw.getBounds()
      const p = this._getCenteredRectangle(bounds.width, bounds.height)
      this._aw.setPosition(p.x, p.y)
    }

    this._log.info('重置辅助窗口位置到主显示器中心')
  }

  private _getCenteredRectangle(width: number, height: number) {
    let { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

    let x = Math.round((screenWidth - width) / 2)
    let y = Math.round((screenHeight - height) / 2)

    return { x, y, width, height }
  }

  private _handleAuxWindowObservations() {
    const auxWindowIndicatorShowTiming = computed(() => {
      if (!this.settings.auxWindowAutoShow) {
        return 'ignore'
      }

      switch (this._lc.data.gameflow.phase) {
        case 'ChampSelect':
          if (this._lc.data.champSelect.session?.isSpectating) {
            return 'ignore'
          }
        case 'Lobby':
        case 'Matchmaking':
        case 'ReadyCheck':
          return 'show'
      }

      return 'hide'
    })

    const auxWindowOpggShowTiming = computed(() => {
      if (!this.settings.auxWindowAutoShow) {
        return 'ignore'
      }

      switch (this._lc.data.gameflow.phase) {
        case 'ChampSelect':
          return 'show'
      }

      return 'normal'
    })

    // normally show & hide
    this._mobx.reaction(
      () => auxWindowIndicatorShowTiming.get(),
      (timing) => {
        if (this.state.auxWindowFunctionality !== 'indicator') {
          return
        }

        if (timing === 'ignore') {
          return
        }

        if (timing === 'show') {
          this.showOrRestoreAuxWindow(true)
        } else {
          this.hideAuxWindow()
        }
      }
    )

    // shows only in champ select and never hides
    this._mobx.reaction(
      () => auxWindowOpggShowTiming.get(),
      (timing) => {
        if (this.state.auxWindowFunctionality !== 'opgg') {
          return
        }

        if (timing === 'show') {
          this.showOrRestoreAuxWindow(true)
        }
      }
    )

    this._mobx.reaction(
      () => this.state.auxWindowBounds,
      (bounds) => {
        if (bounds) {
          const currentFunctionality = this.state.auxWindowFunctionality
          if (currentFunctionality) {
            this.state.setAuxWindowFunctionalityBounds({
              ...this.state.auxWindowFunctionalityBounds,
              [currentFunctionality]: bounds
            })
          }
        }
      },
      { delay: 250, equals: comparer.shallow }
    )

    this._mobx.reaction(
      () => this.state.auxWindowFunctionality,
      (f) => {
        this._setting._saveToStorage('auxWindowFunctionality', f)
      }
    )

    this._mobx.reaction(
      () => this.settings.auxWindowOpacity,
      (o) => {
        this._aw?.setOpacity(o)
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => [this.settings.auxWindowEnabled] as const,
      ([enabled]) => {
        if (enabled) {
          this.createAuxWindow()
        } else {
          this.closeAuxWindow()
        }
      },
      { fireImmediately: true, delay: 500, equals: comparer.shallow }
    )

    this._mobx.reaction(
      () => this._lc.state.connectionState,
      (state) => {
        if (state !== 'connected') {
          this.hideAuxWindow()
        }
      }
    )

    this._mobx.reaction(
      () => this.state.auxWindowFunctionalityBounds,
      (bounds) => {
        this._setting._saveToStorage('auxWindowFunctionalityBounds', bounds)
      },
      { delay: 500 }
    )
  }

  private _handleMainWindowObservations() {
    this._mobx.reaction(
      () => this.state.mainWindowSize,
      (size) => {
        this._setting._saveToStorage('mainWindowSize', size)
      },
      { delay: 500 }
    )
  }

  createAuxWindow() {
    if (!this._aw || this._aw.isDestroyed()) {
      this._createAuxWindow()
    }
  }

  createMainWindow() {
    if (!this._mw || this._mw.isDestroyed()) {
      this._createMainWindow()
    }
  }

  showOrRestoreMainWindow(inactive = false) {
    if (this._mw && this.state.mainWindowReady) {
      if (!this.state.mainWindowShow) {
        if (inactive) {
          this._mw.showInactive()
        } else {
          this._mw.show()
        }

        return
      }

      if (this._mw.isMinimized()) {
        this._mw.restore()
      }
      this._mw.focus()
    }
  }

  toggleDevtoolsMainWindow() {
    this._mw?.webContents.toggleDevTools()
  }

  toggleDevtoolsAuxWindow() {
    this._aw?.webContents.toggleDevTools()
  }

  toggleMainWindowMinimizedAndFocused() {
    if (this._mw) {
      if (!this.state.mainWindowShow) {
        this._mw.show()
        this._mw.focus()
        return
      }

      if (this._mw.isMinimized()) {
        this._mw.restore()
        this._mw.focus()
      } else {
        this._mw.minimize()
      }
    }
  }

  forceMainWindowQuit() {
    this._willQuit = true
    this._mw?.close()
  }

  async onFinish() {
    this._shared.global.events.on('second-instance', () => {
      this.showOrRestoreMainWindow()
    })
    this.createMainWindow()
  }
}
