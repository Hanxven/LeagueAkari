import { is } from '@electron-toolkit/utils'
import { GameClientMain } from '@main/shards/game-client'
import { AkariIpcError } from '@main/shards/ipc'
import icon from '@resources/LA_ICON.ico?asset'
import { comparer } from 'mobx'

import { type WindowManagerMainContext } from '..'
import { BaseAkariWindow } from '../base-akari-window'
import { OngoingGameWindowSettings, OngoingGameWindowState } from './state'

export class AkariOngoingGameWindow extends BaseAkariWindow<
  OngoingGameWindowState,
  OngoingGameWindowSettings
> {
  static readonly NAMESPACE_SUFFIX = 'ongoing-game-window'
  static readonly HTML_ENTRY = 'ongoing-game-window.html'
  static readonly TITLE = 'Akari Ongoing Game Inspector'
  static readonly BASE_WIDTH = 1300
  static readonly BASE_HEIGHT = 840

  static readonly POLL_INTERVAL = 400

  public shortcutTargetId: string

  constructor(_context: WindowManagerMainContext) {
    const state = new OngoingGameWindowState()
    const settings = new OngoingGameWindowSettings()

    super(_context, AkariOngoingGameWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariOngoingGameWindow.BASE_WIDTH,
      baseHeight: AkariOngoingGameWindow.BASE_HEIGHT,
      minWidth: AkariOngoingGameWindow.BASE_WIDTH,
      minHeight: AkariOngoingGameWindow.BASE_HEIGHT,
      htmlEntry: AkariOngoingGameWindow.HTML_ENTRY,
      rememberPosition: false,
      rememberSize: false,
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
        hasShadow: false,
        thickFrame: false,
        roundedCorners: false,
        skipTaskbar: true,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        webPreferences: {
          backgroundThrottling: true // focusable 和 backgroundThrottling 一起使用, 会出现莫名其妙的 BUG
        }
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _handleOngoingGameWindowLogics() {
    if (!this.settings.pinned) {
      this._setting.set('pinned', true)
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

        if (this._window) {
          this._window.setIgnoreMouseEvents(true)
          this.show()
        }
      }
    )

    this._mobx.reaction(
      () => this.state.fakeShow,
      (fakeShow) => {
        if (fakeShow) {
          this._window?.setIgnoreMouseEvents(false)
        } else {
          this._window?.setIgnoreMouseEvents(true)
        }
      },
      { fireImmediately: true }
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
                    if (!this.state.show) {
                      this.show()
                    }

                    this._window?.setIgnoreMouseEvents(false)
                    this.state.setFakeShow(true)
                  }
                } else {
                  this._window?.setIgnoreMouseEvents(true)
                  this.state.setFakeShow(false)
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

  override hide() {
    this.state.setFakeShow(true)
  }

  override async onInit() {
    await super.onInit()

    // 这个窗口仅仅在管理员权限下才会正常工作, 因为它依赖了全局钩子快捷键
    if (!this._app.state.isAdministrator) {
      return
    }

    this._handleOngoingGameWindowLogics()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'showShortcut'] as const
  }

  protected override getStatePropKeys() {
    return ['fakeShow'] as const
  }
}
