import toolsAddon from '@main/native/la-tools-win64.node'
import { comparer, computed } from 'mobx'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/OPGG_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import {
  getPositionWithSnap,
  repositionToAlignLeagueClientUx,
  repositionWindowWithSnap
} from '../position-utils'
import { OpggWindowSettings, OpggWindowState } from './state'

export class AkariOpggWindow extends BaseAkariWindow<OpggWindowState, OpggWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'opgg-window'
  static readonly HTML_ENTRY = 'opgg-window.html'
  static readonly TITLE = 'OP.GG Akari'
  static readonly BASE_WIDTH = 480
  static readonly BASE_HEIGHT = 720
  static readonly MIN_WIDTH = 530
  static readonly MIN_HEIGHT = 530

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
        autoShow: { default: settings.autoShow }
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
      ([enabled, ready]) => {
        if (!ready) {
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
  }

  override async onInit() {
    await super.onInit()

    this._handleOpggWindowLogics()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'autoShow'] as const
  }
}
