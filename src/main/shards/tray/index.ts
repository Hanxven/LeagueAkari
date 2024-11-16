import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Menu, MenuItem, Tray } from 'electron'

import icon from '../../../../resources/LA_ICON.ico?asset'
import { MobxUtilsMain } from '../mobx-utils'
import { WindowManagerMain } from '../window-manager'

/**
 * 有关托盘区那里的逻辑
 */
export class TrayMain implements IAkariShardInitDispose {
  static id = 'tray-main'
  static dependencies = ['window-manager-main', 'mobx-utils-main']

  private readonly _wm: WindowManagerMain
  private readonly _mobx: MobxUtilsMain

  private readonly _tray: Tray
  private readonly _auxWindowTrayItem: MenuItem
  private readonly _auxWindowTrayDevItem: MenuItem
  private readonly _contextMenu: Menu

  constructor(deps: any) {
    this._wm = deps['window-manager-main']
    this._mobx = deps['mobx-utils-main']

    this._tray = new Tray(icon)
    this._auxWindowTrayItem = new MenuItem({
      label: '小窗口',
      type: 'normal',
      click: () => this._wm.showOrRestoreAuxWindow()
    })

    this._auxWindowTrayDevItem = new MenuItem({
      label: 'Toggle DevTools - 辅助窗口',
      type: 'normal',
      click: () => this._wm.toggleDevtoolsAuxWindow()
    })

    const devSubMenu = new Menu()
    devSubMenu.append(
      new MenuItem({
        label: 'Toggle DevTools - 主窗口',
        type: 'normal',
        click: () => this._wm.toggleDevtoolsMainWindow()
      })
    )
    devSubMenu.append(this._auxWindowTrayDevItem)

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
        submenu: devSubMenu
      },
      {
        type: 'separator'
      },
      this._auxWindowTrayItem,
      {
        label: '退出',
        type: 'normal',
        click: () => this._wm.forceMainWindowQuit()
      }
    ])

    this._tray.setToolTip('League Akari')
    this._tray.setContextMenu(this._contextMenu)
    this._tray.addListener('click', () => this._wm.toggleMainWindowMinimizedAndFocused())
  }

  async onInit() {
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
      }
    )
  }

  async onDispose() {
    this._tray.destroy()
  }
}
