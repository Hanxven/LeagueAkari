import { is } from '@electron-toolkit/utils'
import { GameClientMain } from '@main/shards/game-client'
import { AkariIpcError } from '@main/shards/ipc'
import { comparer } from 'mobx'

import { WindowManagerMain, type WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { OngoingGameOverlayWindowSettings, OngoingGameOverlayWindowState } from './state'

export class AkariOngoingGameWindow extends BaseAkariWindow<
  OngoingGameOverlayWindowState,
  OngoingGameOverlayWindowSettings
> {
  static readonly NAMESPACE_SUFFIX = 'ongoing-game-window'
  static readonly HTML_ENTRY = 'ongoing-game-window.html'
  static readonly TITLE = 'Akari Ongoing Game Inspector'
  static readonly BASE_WIDTH = 1300
  static readonly BASE_HEIGHT = 840

  static readonly POLL_INTERVAL = 400

  public shortcutTargetId: string

  constructor(_context: WindowManagerMainContext) {
    const state = new OngoingGameOverlayWindowState()
    const settings = new OngoingGameOverlayWindowSettings()

    super(_context, AkariOngoingGameWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariOngoingGameWindow.BASE_WIDTH,
      baseHeight: AkariOngoingGameWindow.BASE_HEIGHT,
      minWidth: AkariOngoingGameWindow.BASE_WIDTH,
      minHeight: AkariOngoingGameWindow.BASE_HEIGHT,
      htmlEntry: AkariOngoingGameWindow.HTML_ENTRY,
      rememberPosition: false,
      settingSchema: {
        enabled: { default: settings.enabled },
        showShortcut: { default: settings.showShortcut }
      },
      browserWindowOptions: {
        title: AkariOngoingGameWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        resizable: false,
        focusable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        transparent: true,
        skipTaskbar: true,
        autoHideMenuBar: true,
        backgroundColor: '#00000000'
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _handleOngoingGameWindowLogics() {
    if (!this.settings.pinned) {
      this.settings.setPinned(true)
    }

    this._setting.onChange('pinned', (value: boolean) => {
      if (!value) {
        throw new AkariIpcError('ongoing-game 窗口必须置顶', 'UnsupportedActionNotTopmost')
      }
    })

    this._mobx.reaction(
      () => [this.settings.enabled, this._windowManager.state.isManagerFinishedInit],
      ([enabled, finishedInit]) => {
        if (!finishedInit) {
          return
        }

        if (enabled) {
          this.createWindow()
        } else {
          this.close(true)
        }
      },
      {
        fireImmediately: true,
        equals: comparer.shallow,
        delay: 500
      }
    )

    this._mobx.reaction(
      () => this.state.ready,
      (ready) => {
        if (!ready) {
          return
        }

        this._setAboveTheWorld()
      }
    )

    this._mobx.reaction(
      () => this.settings.showShortcut,
      (shortcut) => {
        if (shortcut) {
          try {
            this._keyboardShortcuts.register(
              this.shortcutTargetId,
              shortcut,
              'stateful',
              (event) => {
                if (event.pressed) {
                  if (is.dev || GameClientMain.isGameClientForeground()) {
                    // backgroundThrottling 为 false 可以保证动画效果
                    // 但不知道为什么, 如果同时设置 focusable 为 false, 会在 hide 之后导致鼠标事件无法响应
                    // 这里先设置为 true, 等待 hide 完成后再设置为 false
                    this._window?.setFocusable(true)
                    this.show()
                    this._window?.setFocusable(false)
                  }
                } else {
                  this.hide()
                }
              }
            )
          } catch {
            this._log.warn('无法注册 ongoing-game 窗口快捷键')
            this._setting.set('showShortcut', null)
          }
        } else {
          this._log.debug('注销 ongoing-game 窗口快捷键')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
        }
      },
      { fireImmediately: true }
    )
  }

  private _updateShortcut() {}

  override async onInit() {
    await super.onInit()

    // 这个窗口仅仅在管理员权限下才会正常工作, 因为它依赖了全局钩子快捷键
    if (!this._app.state.isAdministrator) {
      return
    }

    this._handleOngoingGameWindowLogics()
  }

  private _setAboveTheWorld() {
    if (this.window) {
      const result = WindowManagerMain.overlay.enable(this.window.getNativeWindowHandle())

      if (!result.res) {
        this._log.warn('无法更改 ongoing-game 窗口层级', result.msg)
      }
    } else {
      this._log.warn('无法更改 ongoing-game 窗口层级, 窗口不存在')
    }
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'showShortcut'] as const
  }
}
