import { AkariIpcError } from '@main/shards/ipc'
import { comparer, computed } from 'mobx'

import { WindowManagerMain, type WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { CdTimerWindowSettings, CdTimerWindowState } from './state'

export class AkariCdTimerWindow extends BaseAkariWindow<CdTimerWindowState, CdTimerWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'cd-timer-window'
  static readonly HTML_ENTRY = 'cd-timer-window.html'
  static readonly TITLE = 'Akari Timer'
  static readonly BASE_WIDTH = 100 // 100 for auto resize
  static readonly BASE_HEIGHT = 220 // 220 for 5 players (as default)
  static readonly MIN_WIDTH = 100
  static readonly MIN_HEIGHT = 100

  public shortcutTargetId: string

  constructor(_context: WindowManagerMainContext) {
    const state = new CdTimerWindowState()
    const settings = new CdTimerWindowSettings()

    super(_context, AkariCdTimerWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariCdTimerWindow.BASE_WIDTH,
      baseHeight: AkariCdTimerWindow.BASE_HEIGHT,
      minWidth: AkariCdTimerWindow.BASE_WIDTH,
      minHeight: AkariCdTimerWindow.BASE_HEIGHT,
      htmlEntry: AkariCdTimerWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: false,
      settingSchema: {
        enabled: { default: settings.enabled },
        showShortcut: { default: settings.showShortcut },
        timerType: { default: settings.timerType }
      },
      browserWindowOptions: {
        title: AkariCdTimerWindow.TITLE,
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
        backgroundColor: '#00000000',
        webPreferences: {
          backgroundThrottling: true // focusable: false 和 backgroundThrottling: false 一起使用, 会出现莫名其妙的 BUG
        }
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _handleCdTimerWindowLogics() {
    if (!this.settings.pinned) {
      this._setting.set('pinned', true)
    }

    this._setting.onChange('pinned', (value: boolean) => {
      if (!value) {
        throw new AkariIpcError('cd-timer 窗口必须置顶', 'UnsupportedActionNotTopmost')
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

        // TODO DEBUG NEVER ABOVE
        if (this._window) {
          if (!WindowManagerMain.setAboveTheWorld(this._window!).res) {
            this._log.warn('无法将 cd-timer 窗口置顶')
          }
        }

        // DEBUG
        this.show()
      }
    )

    this._mobx.reaction(
      () => this.settings.showShortcut,
      (shortcut) => {
        if (shortcut) {
          try {
            this._keyboardShortcuts.register(this.shortcutTargetId, shortcut, 'normal', () => {
              this._log.debug('cd-timer 窗口快捷键触发')
              if (this.state.show) {
                this.hide()
              } else {
                this.show()
              }
            })
          } catch {
            this._log.warn('无法注册 cd-timer 窗口快捷键')
            this._setting.set('showShortcut', null)
          }
        } else {
          this._log.debug('注销 cd-timer 窗口快捷键')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
        }
      },
      { fireImmediately: true }
    )

    const shouldShow = computed(() => {
      if (this._leagueClient.data.gameflow.phase === 'InProgress') {
        return true
      }

      return false
    })

    this._mobx.reaction(
      () => shouldShow.get(),
      (show) => {
        if (show) {
          this.show()
        } else {
          this.hide()
        }
      },
      { fireImmediately: true }
    )
  }

  override async onInit() {
    await super.onInit()

    // 出于稳定性考虑, 仍要求管理员权限
    if (!this._app.state.isAdministrator) {
      return
    }

    this._handleCdTimerWindowLogics()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'showShortcut', 'timerType'] as const
  }
}
