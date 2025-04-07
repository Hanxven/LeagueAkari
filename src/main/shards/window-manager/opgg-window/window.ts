import { GameClientMain } from '@main/shards/game-client'
import icon from '@resources/OPGG_ICON.ico?asset'
import { comparer, computed } from 'mobx'

import type { WindowManagerMainContext } from '..'
import { BaseAkariWindow } from '../base-akari-window'
import { repositionToAlignLeagueClientUx } from '../position-utils'
import { OpggWindowSettings, OpggWindowState } from './state'

export class AkariOpggWindow extends BaseAkariWindow<OpggWindowState, OpggWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'opgg-window'
  static readonly HTML_ENTRY = 'opgg-window.html'
  static readonly TITLE = 'OP.GG Akari'
  static readonly BASE_WIDTH = 480
  static readonly BASE_HEIGHT = 720
  static readonly MIN_WIDTH = 530
  static readonly MIN_HEIGHT = 530

  public shortcutTargetId: string

  constructor(_context: WindowManagerMainContext) {
    const state = new OpggWindowState()
    const settings = new OpggWindowSettings()

    super(_context, AkariOpggWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariOpggWindow.BASE_WIDTH,
      baseHeight: AkariOpggWindow.BASE_HEIGHT,
      minWidth: AkariOpggWindow.MIN_WIDTH,
      minHeight: AkariOpggWindow.MIN_HEIGHT,
      htmlEntry: AkariOpggWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: true,
      settingSchema: {
        enabled: { default: settings.enabled },
        autoShow: { default: settings.autoShow },
        showShortcut: { default: settings.showShortcut }
      },
      browserWindowOptions: {
        title: AkariOpggWindow.TITLE,
        icon: icon,
        show: false,
        fullscreenable: false,
        frame: false,
        maximizable: false
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _handleOpggWindowLogics() {
    const showTiming = computed(() => {
      if (!this.settings.autoShow) {
        return 'ignore'
      }

      if (!this.state.ready) {
        return 'ignore'
      }

      switch (this._context.leagueClient.data.gameflow.phase) {
        case 'ChampSelect':
          return 'show'
      }

      return 'normal'
    })

    // 在英雄选择阶段会主动展示, 其他阶段不会主动关闭
    this._context.mobx.reaction(
      () => showTiming.get(),
      (timing) => {
        if (timing === 'show') {
          this.showOrRestore()
        }
      }
    )

    this._context.mobx.reaction(
      () =>
        [this.settings.enabled, this._context.windowManager.state.isManagerFinishedInit] as const,
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
      { fireImmediately: true, delay: 500, equals: comparer.shallow }
    )

    this._ipc.onCall(this._namespace, 'repositionToAlignLeagueClientUx', (_, placement) => {
      if (this._window) {
        repositionToAlignLeagueClientUx(this._window, placement)
      }
    })

    this._mobx.reaction(
      () => this.settings.showShortcut,
      (shortcut) => {
        if (shortcut) {
          try {
            this._keyboardShortcuts.register(this.shortcutTargetId, shortcut, 'normal', () => {
              if (!this.state.show && GameClientMain.isGameClientForeground()) {
                this.setPinned(true)
              }

              if (this.state.show) {
                this.hide()
              } else {
                this.show()
              }
            })
          } catch {
            this._log.warn('无法注册 opgg 窗口快捷键')
            this._setting.set('showShortcut', null)
          }
        } else {
          this._log.debug('注销 opgg 窗口快捷键')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
        }
      },
      { fireImmediately: true }
    )
  }

  override async onInit() {
    await super.onInit()

    this._handleOpggWindowLogics()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'autoShow', 'showShortcut'] as const
  }
}
