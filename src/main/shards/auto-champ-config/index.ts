import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoChampConfigSettings } from './state'

export class AutoChampionConfigMain implements IAkariShardInitDispose {
  static id = 'auto-champ-config-main'

  static dependencies = [
    'akari-ipc-main',
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main',
    'mobx-utils-main'
  ]

  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _lc: LeagueClientMain
  private readonly _setting: SetterSettingService
  private readonly _mobx: MobxUtilsMain
  private readonly _ipc: AkariIpcMain

  public readonly settings = new AutoChampConfigSettings()

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._settingFactory = deps['setting-factory-main']
    this._log = this._loggerFactory.create(AutoChampionConfigMain.id)
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._setting = this._settingFactory.create(
      AutoChampionConfigMain.id,
      {
        enabled: { default: this.settings.enabled },
        runeV2Presets: { default: this.settings.runeV2Presets },
        summonerSpellPresets: { default: this.settings.summonerSpellPresets }
      },
      this.settings
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(
      AutoChampionConfigMain.id,
      'updateChampionPreset',
      (
        championId: number,
        position: string,
        runes: {
          primaryStyleId: number
          subStyleId: number
          selectedPerkIds: number[]
        } | null
      ) => {
        this.settings.updateRulePresetChampion(championId, position, runes)
      }
    )

    this._ipc.onCall(
      AutoChampionConfigMain.id,
      'updateSummonerSpellPreset',
      (
        championId: number,
        position: string,
        spells: {
          spell1Id: number
          spell2Id: number
        } | null
      ) => {
        this.settings.updateSummonerSpellPreset(championId, position, spells)
      }
    )
  }

  async onInit() {
    await this._setting.applyToState()

    this._mobx.propSync(AutoChampionConfigMain.id, 'settings', this.settings, [
      'enabled',
      'runeV2Presets',
      'summonerSpellPresets'
    ])

    this._handleIpcCall()
  }
}
