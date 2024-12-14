import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoRuneSettings } from './state'

export class AutoRuneMain implements IAkariShardInitDispose {
  static id = 'auto-rune-main'

  static dependencies = [
    'akari-ipc-main',
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main',
    'mobx-utils-main',
    'config-migrate-main'
  ]

  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _lc: LeagueClientMain
  private readonly _setting: SetterSettingService
  private readonly _mobx: MobxUtilsMain
  private readonly _ipc: AkariIpcMain

  public readonly settings = new AutoRuneSettings()

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._settingFactory = deps['setting-factory-main']
    this._log = this._loggerFactory.create(AutoRuneMain.id)
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._setting = this._settingFactory.create(
      AutoRuneMain.id,
      {
        enabled: { default: this.settings.enabled },
        presetsV2: { default: this.settings.presetsV2 }
      },
      this.settings
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(
      AutoRuneMain.id,
      'updateChampionPreset',
      (championId: number, position: string, runes: number[] | null) => {
        this.settings.updatePresetChampion(championId, position, runes)
      }
    )
  }

  async onInit() {
    await this._setting.applyToState()

    this._mobx.propSync(AutoRuneMain.id, 'settings', this.settings, ['enabled', 'presetsV2'])

    this._handleIpcCall()
  }
}
