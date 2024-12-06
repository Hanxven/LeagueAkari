import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Menu, MenuItem, Tray } from 'electron'
import i18next from 'i18next'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { AppCommonMain } from '../app-common'
import { MobxUtilsMain } from '../mobx-utils'
import { WindowManagerMain } from '../window-manager'

/**
 * 有关托盘区那里的逻辑
 */
export class TrayMain implements IAkariShardInitDispose {
  static id = 'tray-main'
  static dependencies = ['window-manager-main', 'mobx-utils-main', 'app-common-main']

  private readonly _wm: WindowManagerMain
  private readonly _mobx: MobxUtilsMain

  private readonly _app: AppCommonMain

  private _tray: Tray | null = null
  private _mainWindowDevTrayItem: MenuItem
  private _auxWindowTrayItem: MenuItem
  private _auxWindowTrayDevItem: MenuItem
  private _quitTrayItem: MenuItem
  private _contextMenu: Menu

  constructor(deps: any) {
    this._wm = deps['window-manager-main']
    this._mobx = deps['mobx-utils-main']
    this._app = deps['app-common-main']
  }

  private _buildTray() {
    this._tray = new Tray(icon)

    this._auxWindowTrayItem = new MenuItem({
      label: i18next.t('tray.auxWindow'),
      type: 'normal',
      click: () => this._wm.showOrRestoreAuxWindow()
    })

    this._auxWindowTrayDevItem = new MenuItem({
      id: 'aux-window-dev',
      label: i18next.t('tray.dev.toggleAuxWindowDevtools'),
      type: 'normal',
      click: () => this._wm.toggleDevtoolsAuxWindow()
    })

    this._mainWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleMainWindowDevtools'),
      type: 'normal',
      click: () => this._wm.toggleDevtoolsMainWindow()
    })

    this._quitTrayItem = new MenuItem({
      label: i18next.t('tray.quit'),
      type: 'normal',
      click: () => this._wm.forceMainWindowQuit()
    })

    this._contextMenu = Menu.buildFromTemplate([
      {
        label: 'Akari~ Akari!',
        type: 'normal',
        click: () => this._wm.showOrRestoreMainWindow()
      },
      {
        type: 'separator'
      },
      {
        label: 'Dev',
        type: 'submenu',
        submenu: Menu.buildFromTemplate([this._mainWindowDevTrayItem, this._auxWindowTrayDevItem])
      },
      {
        type: 'separator'
      },
      this._auxWindowTrayItem,
      this._quitTrayItem
    ])

    this._tray.setToolTip('League Akari')
    this._tray.setContextMenu(this._contextMenu)
    this._tray.addListener('click', () => this._wm.toggleMainWindowMinimizedAndFocused())
  }

  async onInit() {
    this._buildTray()

    this._mobx.reaction(
      () => this._wm.settings.auxWindowEnabled,
      (e) => {
        if (e) {
          this._auxWindowTrayDevItem.enabled = true
          this._auxWindowTrayItem.enabled = true
        } else {
          this._auxWindowTrayDevItem.enabled = false
          this._auxWindowTrayItem.enabled = false
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
