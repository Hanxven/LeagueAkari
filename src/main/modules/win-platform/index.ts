import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'
import SendInputWorker from '@main/workers/send-input?nodeWorker'
import { Menu, MenuItem, Notification, Tray, app } from 'electron'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import { randomUUID } from 'node:crypto'
import EventEmitter from 'node:events'
import { Worker } from 'node:worker_threads'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { AuxWindowModule } from '../auxiliary-window'
import { AppLogger, LogModule } from '../log'
import { MainWindowModule } from '../main-window'
import { AppModule } from '../app'

export class PlatformModule extends MobxBasedBasicModule {
  private _worker: null | Worker = null
  private _gkl: GlobalKeyboardListener | null = null

  private _logModule: LogModule
  private _appModule: AppModule
  private _mwm: MainWindowModule
  private _awm: AuxWindowModule
  private _logger: AppLogger

  private _tray: Tray | null = null
  private _auxWindowTrayItem: MenuItem | null = null
  private _auxWindowTrayDevItem: MenuItem | null = null

  private _bus = new EventEmitter()

  constructor() {
    super('win-platform')
  }

  get bus() {
    return this._bus
  }

  get gkl() {
    return this._gkl
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._appModule = this.manager.getModule<AppModule>('app')
    this._mwm = this.manager.getModule<MainWindowModule>('main-window')
    this._awm = this.manager.getModule<AuxWindowModule>('auxiliary-window')
    this._logger = this._logModule.createLogger('win-platform')

    if (this._appModule.state.isAdministrator) {
      this._worker = SendInputWorker({})
      this._initGlobalKeyListener()
    }

    this._initTray()

    this._appModule.addQuitTask(() => {
      this._worker?.terminate()
      this._gkl?.kill()
      this._worker = null
      this._gkl = null
    })

    this._setupMethodCall()
    this._handleAuxWindow()

    this._logger.info('初始化完成')
  }

  private _handleAuxWindow() {
    this.reaction(
      () => this._awm.state.settings.enabled,
      (e) => {
        if (e) {
          this.setAuxWindowTrayItemEnabled(true)
        } else {
          this.setAuxWindowTrayItemEnabled(false)
        }
      }
    )
  }

  private _initGlobalKeyListener() {
    const gkl = new GlobalKeyboardListener()

    let pageUpShortcut = false
    let pageDownShortcut = false
    let deleteShortcut = false

    // ! refactor this
    // ! refactor this
    // ! refactor this
    // ! 逻辑冗余，将在之后重构
    gkl.addListener((event) => {
      if (event.state === 'DOWN') {
        if (event.name === 'PAGE UP') {
          pageUpShortcut = true
        } else if (event.name === 'PAGE DOWN') {
          pageDownShortcut = true
        } else if (event.name === 'DELETE') {
          deleteShortcut = true
        }
      }

      if (event.state === 'UP') {
        if (event.name === 'PAGE UP' && pageUpShortcut) {
          pageUpShortcut = false
          this._bus.emit('global-shortcut/page-up')
          this.sendEvent('key', 'page-up')
        } else if (event.name === 'PAGE DOWN' && pageDownShortcut) {
          pageDownShortcut = false
          this._bus.emit('global-shortcut/page-down')
          this.sendEvent('key', 'page-down')
        } else if (event.name === 'DELETE' && deleteShortcut) {
          deleteShortcut = false
          this._bus.emit('global-shortcut/delete')
          this.sendEvent('key', 'delete')
        }
      }
    })

    this._gkl = gkl
  }

  setAuxWindowTrayItemEnabled(enabled: boolean) {
    if (this._auxWindowTrayItem) {
      this._auxWindowTrayItem.enabled = enabled
    }

    if (this._auxWindowTrayDevItem) {
      this._auxWindowTrayDevItem.enabled = enabled
    }
  }

  private _initTray() {
    this._tray = new Tray(icon)

    this._auxWindowTrayItem = new MenuItem({
      label: '小窗口',
      type: 'normal',
      click: () => {
        this._awm.showWindow()
      }
    })

    this._auxWindowTrayDevItem = new MenuItem({
      label: 'Toggle DevTools - AuxiliaryWindow',
      type: 'normal',
      click: () => {
        this._awm.auxWindow?.webContents.toggleDevTools()
      }
    })

    const devSubMenu = new Menu()
    devSubMenu.append(
      new MenuItem({
        label: 'Toggle DevTools - MainWindow',
        type: 'normal',
        click: () => {
          this._mwm.mainWindow?.webContents.toggleDevTools()
        }
      })
    )
    devSubMenu.append(this._auxWindowTrayDevItem)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'League Akari',
        type: 'normal',
        click: () => {
          this._mwm.restoreAndFocus()
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Dev',
        type: 'submenu',
        submenu: devSubMenu
      },
      {
        type: 'separator'
      },
      this._auxWindowTrayItem,
      {
        label: '退出',
        type: 'normal',
        click: () => {
          app.quit()
        }
      }
    ])

    this._tray.setToolTip('League Akari')
    this._tray.setContextMenu(contextMenu)
    this._tray.addListener('click', () => {
      this._mwm.toggleMinimizedAndFocused()
    })
  }

  sendKey(key: number, pressed: boolean) {
    this._worker?.postMessage({ type: 'key', key, press: pressed })
  }

  sendInputString(str: string) {
    this._worker?.postMessage({ type: 'string', data: str })
  }

  private _setupMethodCall() {
    this.onCall('send-key', (key, pressed) => {
      this.sendKey(key, pressed)
    })

    this.onCall('send-string', (str) => {
      this.sendInputString(str)
    })

    this.onCall('notify', (options) => {
      options.id = options.id || randomUUID()

      const notification = new Notification({ ...options })

      notification.on('click', () => {
        this._bus.emit('notification/click', options.id)
        this.sendEvent('notification/click', options.id)
      })

      notification.on('close', () => {
        this._bus.emit('notification/close', options.id)
        this.sendEvent('notification/close', options.id)
      })

      notification.show()
    })
  }
}

export const winPlatformModule = new PlatformModule()
