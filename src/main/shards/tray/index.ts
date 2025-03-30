import icon from '@resources/LA_ICON.ico?asset'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Menu, MenuItem, Tray } from 'electron'
import i18next from 'i18next'
import { comparer } from 'mobx'

import { AppCommonMain } from '../app-common'
import { MobxUtilsMain } from '../mobx-utils'
import { WindowManagerMain } from '../window-manager'

/**
 * 有关托盘区那里的逻辑
 */
@Shard(TrayMain.id)
export class TrayMain implements IAkariShardInitDispose {
  static id = 'tray-main'

  private _tray: Tray | null = null
  private _mainWindowDevTrayItem: MenuItem
  private _auxWindowTrayItem: MenuItem
  private _auxWindowDevTrayItem: MenuItem
  private _opggWindowTrayItem: MenuItem
  private _opggWindowDevTrayItem: MenuItem
  private _ongoingGameWindowDevTrayItem: MenuItem
  private _cdTimerWindowDevTrayItem: MenuItem
  private _quitTrayItem: MenuItem
  private _contextMenu: Menu

  constructor(
    private readonly _wm: WindowManagerMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _app: AppCommonMain
  ) {}

  private _buildTray() {
    this._tray = new Tray(icon)

    this._auxWindowTrayItem = new MenuItem({
      label: i18next.t('tray.auxWindow'),
      type: 'normal',
      click: () => this._wm.auxWindow.showOrRestore()
    })

    this._auxWindowDevTrayItem = new MenuItem({
      id: 'aux-window-dev',
      label: i18next.t('tray.dev.toggleAuxWindowDevtools'),
      type: 'normal',
      click: () => this._wm.auxWindow.toggleDevtools()
    })

    this._mainWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleMainWindowDevtools'),
      type: 'normal',
      click: () => this._wm.mainWindow.toggleDevtools()
    })

    this._opggWindowTrayItem = new MenuItem({
      label: i18next.t('tray.opggWindow'),
      type: 'normal',
      click: () => this._wm.opggWindow.showOrRestore()
    })

    this._opggWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleOpggWindowDevtools'),
      type: 'normal',
      click: () => this._wm.opggWindow.toggleDevtools()
    })

    this._ongoingGameWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleOngoingGameWindowDevtools'),
      type: 'normal',
      click: () => this._wm.ongoingGameWindow?.toggleDevtools()
    })

    this._cdTimerWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleCdTimerWindowDevtools'),
      type: 'normal',
      click: () => this._wm.cdTimerWindow.toggleDevtools()
    })

    this._quitTrayItem = new MenuItem({
      label: i18next.t('tray.quit'),
      type: 'normal',
      click: () => this._wm.mainWindow.close(true)
    })

    this._contextMenu = Menu.buildFromTemplate([
      {
        label: 'League Akari',
        type: 'normal',
        click: () => this._wm.mainWindow.showOrRestore()
      },
      {
        type: 'separator'
      },
      {
        label: 'Dev',
        type: 'submenu',
        submenu: Menu.buildFromTemplate([
          this._mainWindowDevTrayItem,
          this._auxWindowDevTrayItem,
          this._opggWindowDevTrayItem,
          this._ongoingGameWindowDevTrayItem,
          this._cdTimerWindowDevTrayItem
        ])
      },
      {
        type: 'separator'
      },
      this._auxWindowTrayItem,
      this._opggWindowTrayItem,
      this._quitTrayItem
    ])

    this._tray.setToolTip('League Akari')
    this._tray.setContextMenu(this._contextMenu)
    this._tray.addListener('click', () => this._wm.mainWindow.toggleMinimizedAndFocused())
  }

  async onInit() {
    this._buildTray()

    this._mobx.reaction(
      () => [this._wm.auxWindow.settings.enabled, this._wm.auxWindow.state.ready],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._auxWindowDevTrayItem.enabled = true
          this._auxWindowTrayItem.enabled = true
        } else {
          this._auxWindowDevTrayItem.enabled = false
          this._auxWindowTrayItem.enabled = false
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobx.reaction(
      () => [this._wm.opggWindow.settings.enabled, this._wm.opggWindow.state.ready],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._opggWindowDevTrayItem.enabled = true
          this._opggWindowTrayItem.enabled = true
        } else {
          this._opggWindowDevTrayItem.enabled = false
          this._opggWindowTrayItem.enabled = false
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobx.reaction(
      () => [this._wm.ongoingGameWindow.settings.enabled, this._wm.ongoingGameWindow.state.ready],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._ongoingGameWindowDevTrayItem.enabled = true
        } else {
          this._ongoingGameWindowDevTrayItem.enabled = false
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobx.reaction(
      () => [this._wm.cdTimerWindow.settings.enabled, this._wm.cdTimerWindow.state.ready],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._cdTimerWindowDevTrayItem.enabled = true
        } else {
          this._cdTimerWindowDevTrayItem.enabled = false
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this._app.settings.locale,
      (_locale) => {
        if (this._tray) {
          this._tray.destroy()
        }

        this._buildTray()
      }
    )
  }

  async onDispose() {
    this._tray?.destroy()
  }
}
