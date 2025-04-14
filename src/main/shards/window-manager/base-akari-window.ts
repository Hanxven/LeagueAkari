import { is } from '@electron-toolkit/utils'
import { i18next } from '@main/i18n'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import { Paths } from '@shared/utils/types'
import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event,
  IgnoreMouseEventsOptions,
  dialog,
  shell
} from 'electron'
import { comparer, runInAction } from 'mobx'
import EventEmitter from 'node:events'
import path from 'node:path'

import { WindowManagerMain, type WindowManagerMainContext } from '.'
import { AkariProtocolMain } from '../akari-protocol'
import { AppCommonMain } from '../app-common'
import { GameClientMain } from '../game-client'
import { AkariIpcMain } from '../ipc'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingSchema } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { getCenteredRectangle, repositionWindowIfInvisible } from './position-utils'

/**
 * 具备的一些基础属性
 */
export interface BaseAkariWindowBasicState {
  status: 'normal' | 'maximized' | 'minimized'

  focus: 'focused' | 'blurred'

  ready: boolean

  show: boolean

  bounds: Electron.Rectangle | null
}

export interface AkariBaseWindowConfig<TSettings extends BaseAkariWindowBasicSetting> {
  baseWidth: number
  baseHeight: number
  minWidth: number
  minHeight: number

  /**
   * 设置项的额外 schema
   */
  settingSchema?: SettingSchema<TSettings>

  /**
   * HTML 入口文件, 对应 renderer 目录下对应文件
   */
  htmlEntry: string | { path: string; hash: string }

  /**
   * 重新定位窗口, 当窗口不可见时, default: false
   */
  repositionWindowIfInvisible?: boolean

  /**
   * 将记忆上一次的窗口位置, default: false
   */
  rememberPosition?: boolean

  /**
   * 将记忆上一次的窗口大小, default: false
   */
  rememberSize?: boolean

  /**
   * BrowserWindow 选项
   */
  browserWindowOptions?: BrowserWindowConstructorOptions
}

export interface BaseAkariWindowBasicSetting {
  pinned: boolean

  // 一些情况下, 在设置非 1 的不透明度后将完全不可见
  // 该问题位于 https://github.com/electron/electron/issues/45730
  opacity: number
}

/**
 * 预制菜, 封装了窗口的常见状态
 */
export abstract class BaseAkariWindow<
  TState extends BaseAkariWindowBasicState,
  TSettings extends BaseAkariWindowBasicSetting
> extends EventEmitter {
  protected _window: BrowserWindow | null = null
  protected _namespace: string
  protected _partition: string
  protected _log: AkariLogger

  protected _forceClose = false

  protected readonly _setting: SetterSettingService

  protected readonly _app: AppCommonMain

  /** an alias for this._context.ipc */
  protected readonly _ipc: AkariIpcMain

  /** an alias for this._context.mobx */
  protected readonly _mobx: MobxUtilsMain

  /** an alias for this._context.leagueClient */
  protected readonly _leagueClient: LeagueClientMain

  /** an alias for this._context.gameClient */
  protected readonly _gameClient: GameClientMain

  /** an alias for this._context.windowManager */
  protected readonly _windowManager: WindowManagerMain

  /** an alias for this._context.loggerFactory */
  protected readonly _loggerFactory: LoggerFactoryMain

  /** an alias for this._context.protocol */
  protected readonly _protocol: AkariProtocolMain

  protected readonly _keyboardShortcuts: KeyboardShortcutsMain

  constructor(
    /**
     * 由窗口管理器提供的上下文信息
     */
    protected _context: WindowManagerMainContext,

    /**
     * 命名空间后缀, {windowManagerId}/{suffix}
     */
    protected _namespaceSuffix: string,

    /**
     * 窗口封装状态
     */
    public state: TState,

    /**
     * 窗口设置项状态
     */
    public settings: TSettings,

    protected _config: AkariBaseWindowConfig<TSettings>
  ) {
    super()

    this._namespace = `${_context.namespace}/${_namespaceSuffix}`
    this._partition = `persist:${_namespaceSuffix}`
    this._log = _context.loggerFactory.create(this._namespace)
    this._app = _context.app
    this._ipc = _context.ipc
    this._mobx = _context.mobx
    this._leagueClient = _context.leagueClient
    this._gameClient = _context.gameClient
    this._windowManager = _context.windowManager
    this._loggerFactory = _context.loggerFactory
    this._protocol = _context.protocol
    this._keyboardShortcuts = _context.keyboardShortcuts
    this._setting = _context.settingFactory.register(
      this._namespace,
      {
        // @ts-ignore
        pinned: { default: this.settings.pinned },
        opacity: { default: this.settings.opacity },
        ...this._config.settingSchema
      },
      this.settings
    )
  }

  get window() {
    return this._window
  }

  protected _baseWindowIpcCall() {
    this._context.ipc.onCall(this._namespace, 'setSize', async (_, width, height, animate) => {
      this._window?.setSize(width, height, animate)
    })

    this._context.ipc.onCall(this._namespace, 'getSize', async () => {
      return this._window?.getSize()
    })

    this._context.ipc.onCall(this._namespace, 'setPosition', async (_, x, y, animate) => {
      this._window?.setPosition(x, y, animate)
    })

    this._context.ipc.onCall(this._namespace, 'getPosition', async () => {
      return this._window?.getPosition()
    })

    this._context.ipc.onCall(this._namespace, 'minimize', async () => {
      this._window?.minimize()
    })

    this._context.ipc.onCall(this._namespace, 'maximize', async () => {
      this._window?.maximize()
    })

    this._context.ipc.onCall(this._namespace, 'unmaximize', async () => {
      this._window?.unmaximize()
    })

    this._context.ipc.onCall(this._namespace, 'restore', async () => {
      this._window?.restore()
    })

    this._context.ipc.onCall(this._namespace, 'close', async () => {
      this._window?.close()
    })

    this._context.ipc.onCall(this._namespace, 'toggleDevtools', async () => {
      this._window?.webContents.toggleDevTools()
    })

    this._context.ipc.onCall(this._namespace, 'setTitle', (_, title) => {
      this._window?.setTitle(title)
    })

    this._context.ipc.onCall(this._namespace, 'hide', () => {
      this.hide()
    })

    this._context.ipc.onCall(this._namespace, 'show', (_, inactive: boolean = false) => {
      this.showOrRestore(inactive)
    })

    this._context.ipc.onCall(this._namespace, 'resetPosition', () => {
      this.resetPosition()
    })

    this._context.ipc.onCall(
      this._namespace,
      'setIgnoreMouseEvents',
      (_, ignore, options: IgnoreMouseEventsOptions) => {
        this._window?.setIgnoreMouseEvents(ignore, options)
      }
    )
  }

  protected _baseWindowObservations() {
    this._context.mobx.reaction(
      () => this.settings.opacity,
      (o) => {
        this._window?.setOpacity(o)
      },
      { fireImmediately: true }
    )

    this._context.mobx.reaction(
      () => this.settings.pinned,
      (pinned) => {
        this._window?.setAlwaysOnTop(pinned, 'screen-saver')
      },
      { fireImmediately: true }
    )

    this._context.mobx.reaction(
      () => this.state.bounds,
      (bounds) => {
        if (bounds) {
          this._setting._saveToStorage('bounds', bounds)
        }
      },
      { delay: 250, equals: comparer.shallow }
    )
  }

  protected _createWindow() {
    const { webPreferences, ...rest } = this._config.browserWindowOptions || {}

    this._window = new BrowserWindow({
      width: this._config.baseWidth,
      height: this._config.baseHeight,
      minWidth: this._config.minWidth,
      minHeight: this._config.minHeight,
      fullscreenable: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        sandbox: false,
        spellcheck: false,
        partition: this._partition,
        backgroundThrottling: false,
        ...webPreferences
      },
      ...rest
    })

    runInAction(() => {
      this.state.show = this._config.browserWindowOptions?.show ?? true

      // type guard
      if (!this._window) {
        return
      }

      if (this._window.isMinimized()) {
        this.state.status = 'minimized'
      } else {
        this.state.status = 'normal'
      }
    })

    this._window.webContents.on('before-input-event', (event, input) => {
      if (
        (input.control && input.key.toLowerCase() === 'w') ||
        (input.control && input.key.toLowerCase() === 'r') ||
        (input.meta && input.key.toLowerCase() === 'r')
      ) {
        event.preventDefault()
      }
    })

    this._window.setOpacity(this.settings.opacity)
    this._window.setAlwaysOnTop(this.settings.pinned, 'screen-saver')

    runInAction(() => (this.state.focus = this._window!.isFocused() ? 'focused' : 'blurred'))

    if (this.state.bounds) {
      if (this._config.rememberPosition && this._config.rememberSize) {
        this._window.setBounds(this.state.bounds)
      } else if (this._config.rememberPosition) {
        this._window.setPosition(this.state.bounds.x, this.state.bounds.y)
      } else if (this._config.rememberSize) {
        const p = getCenteredRectangle(this.state.bounds.width, this.state.bounds.height)
        this._window.setBounds({
          x: p.x,
          y: p.y,
          width: this.state.bounds.width,
          height: this.state.bounds.height
        })
      }
    }

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

    this._window.on('ready-to-show', () => {
      runInAction(() => (this.state.ready = true))
      if (this._window && this._config.repositionWindowIfInvisible) {
        repositionWindowIfInvisible(this._window)
      }
    })

    this._window.on('unmaximize', () => {
      runInAction(() => (this.state.status = 'normal'))
    })

    this._window.on('maximize', () => {
      runInAction(() => (this.state.status = 'maximized'))
    })

    this._window.on('minimize', () => {
      runInAction(() => (this.state.status = 'minimized'))
    })

    this._window.on('restore', () => {
      runInAction(() => (this.state.status = 'normal'))
    })

    this._window.on('focus', () => {
      runInAction(() => (this.state.focus = 'focused'))
    })

    this._window.on('blur', () => {
      runInAction(() => (this.state.focus = 'blurred'))
    })

    this._window.on('show', () => {
      runInAction(() => (this.state.show = true))
    })

    this._window.on('hide', () => {
      runInAction(() => (this.state.show = false))
    })

    this._window.on('closed', () => {
      runInAction(() => (this.state.ready = false))
      this._window = null
    })

    this._window.on('move', () => {
      if (this._window) {
        const bounds = this._window.getBounds()
        runInAction(() => (this.state.bounds = bounds))
      }
    })

    this._window.on('resize', () => {
      if (this._window) {
        const bounds = this._window.getBounds()
        runInAction(() => (this.state.bounds = bounds))
      }
    })

    this._window.on('page-title-updated', (e) => e.preventDefault())

    this._window.on('close', (e) => {
      this.handleClose(e)
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      if (typeof this._config.htmlEntry !== 'string') {
        this._window.loadURL(
          `${process.env['ELECTRON_RENDERER_URL']}/${this._config.htmlEntry.path}#${this._config.htmlEntry.hash}`
        )
      } else {
        this._window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${this._config.htmlEntry}`)
      }
    } else {
      if (typeof this._config.htmlEntry !== 'string') {
        this._window.loadFile(path.join(__dirname, `../renderer/${this._config.htmlEntry.path}`), {
          hash: this._config.htmlEntry.hash
        })
      } else {
        this._window.loadFile(path.join(__dirname, `../renderer/${this._config.htmlEntry}`))
      }
    }

    this._log.info(`创建 ${this._namespace} 窗口`)
  }

  setOpacity(opacity: number) {
    runInAction(() => {
      this.settings.opacity = opacity
    })
  }

  setPinned(pinned: boolean) {
    runInAction(() => {
      this.settings.pinned = pinned
    })
  }

  createWindow() {
    if (!this._window || this._window.isDestroyed()) {
      this._createWindow()
    }
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

  show(inactive = false) {
    if (this._window && !this.state.show) {
      if (inactive) {
        this._window.showInactive()
      } else {
        this._window.show()
      }
    }
  }

  hide() {
    if (this._window && this.state.show) {
      this._window.hide()
    }
  }

  close(force = false) {
    if (this._window) {
      this._forceClose = force
      this._window.close()
      this._forceClose = false
    }
  }

  resetPosition() {
    if (this._window) {
      this._window.center()
    }

    this._log.info(`重置 ${this._namespace} 位置到主显示器中心`)
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

  protected getStatePropKeys(): readonly Paths<TState>[] {
    return []
  }

  protected getSettingPropKeys(): readonly Paths<TSettings>[] {
    return []
  }

  /**
   * 默认的关闭行为是隐藏窗口
   */
  protected handleClose(e: Event) {
    if (this._forceClose) {
      return
    }

    e.preventDefault()
    this.hide()
  }

  async onInit() {
    await this._setting.applyToState()

    this._protocol.registerPartition(this._partition)

    // @ts-ignore
    this._context.mobx.propSync(this._namespace, 'state', this.state, [
      'focus',
      'ready',
      'status',
      'show',
      'bounds',
      ...this.getStatePropKeys()
    ])

    // @ts-ignore
    this._context.mobx.propSync(this._namespace, 'settings', this.settings, [
      'opacity',
      'pinned',
      ...this.getSettingPropKeys()
    ])

    const bounds = await this._setting._getFromStorage('bounds')
    if (bounds) {
      runInAction(() => {
        this.state.bounds = bounds
      })
    }

    this._baseWindowIpcCall()
    this._baseWindowObservations()
  }

  async onDispose() {}

  async onFinish() {}
}
