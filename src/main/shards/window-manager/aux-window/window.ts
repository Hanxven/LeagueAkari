import { comparer, computed } from 'mobx'

import { WindowManagerMainContext } from '..'
import icon from '../../../../../resources/LA_ICON.ico?asset'
import { BaseAkariWindow } from '../base-akari-window'
import { AuxWindowSettings, AuxWindowState } from './state'

export class AkariAuxWindow extends BaseAkariWindow<AuxWindowState, AuxWindowSettings> {
  constructor(_context: WindowManagerMainContext) {
    const state = new AuxWindowState()
    const settings = new AuxWindowSettings()

    super(_context, 'aux-window', state, settings, {
      baseWidth: 340,
      baseHeight: 420,
      minWidth: 340,
      minHeight: 420,
      htmlEntry: 'aux-window.html',
      rememberPosition: true,
      rememberSize: true,
      settingSchema: {
        enabled: { default: settings.enabled },
        autoShow: { default: settings.autoShow },
        showSkinSelector: { default: settings.showSkinSelector }
      },
      browserWindowOptions: {
        title: 'Mini Akari',
        icon: icon,
        show: false,
        frame: false,
        fullscreenable: false,
        maximizable: false
      }
    })
  }

  private _handleAuxWindowLogics() {
    const showTiming = computed(() => {
      if (!this.settings.autoShow) {
        return 'ignore'
      }

      if (!this.state.ready) {
        return 'ignore'
      }

      switch (this._leagueClient.data.gameflow.phase) {
        case 'ChampSelect':
          if (this._leagueClient.data.champSelect.session?.isSpectating) {
            return 'ignore'
          }
        case 'Lobby':
        case 'Matchmaking':
        case 'ReadyCheck':
          return 'show'
      }

      return 'hide'
    })

    // normally show & hide
    this._context.mobx.reaction(
      () => showTiming.get(),
      (timing) => {
        if (timing === 'ignore') {
          return
        }

        if (timing === 'show') {
          this.showOrRestore(true)
        } else {
          this.hide()
        }
      },
      { fireImmediately: true }
    )

    this._context.mobx.reaction(
      () => [this.settings.enabled, this._windowManager.state.isShardsReady] as const,
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

    this._context.mobx.reaction(
      () => this._leagueClient.state.connectionState,
      (state) => {
        if (state !== 'connected') {
          this.hide()
        }
      }
    )
  }

  override async onInit() {
    await super.onInit()

    this._handleAuxWindowLogics()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'autoShow', 'showSkinSelector'] as const
  }
}
