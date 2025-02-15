import { comparer, computed } from 'mobx'

import type { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/OPGG_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { OpggWindowSettings, OpggWindowState } from './state'

export class AkariOpggWindow extends BaseAkariWindow<OpggWindowState, OpggWindowSettings> {
  constructor(_context: WindowManagerMainContext) {
    const state = new OpggWindowState()
    const settings = new OpggWindowSettings()

    super(_context, 'opgg-window', state, settings, {
      baseWidth: 480,
      baseHeight: 720,
      minWidth: 530,
      minHeight: 530,
      htmlEntry: 'opgg-window.html',
      rememberPosition: true,
      rememberSize: true,
      settingSchema: {
        enabled: { default: settings.enabled },
        autoShow: { default: settings.autoShow }
      },
      browserWindowOptions: {
        title: 'OP.GG Akari',
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
      () => [this.settings.enabled, this._context.windowManager.state.isShardsReady] as const,
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
  }

  override async onInit() {
    await super.onInit()

    this._handleOpggWindowLogics()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'autoShow'] as const
  }
}
