import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoChampConfigSettings, ChampionRunesConfig, SummonerSpellsConfig } from './state'

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
        runesV2: { default: this.settings.runesV2 },
        summonerSpells: { default: this.settings.summonerSpells }
      },
      this.settings
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(
      AutoChampionConfigMain.id,
      'updateRunes',
      async (championId: number, key: string, runes: ChampionRunesConfig | null) => {
        this.settings.updateRunes(championId, key, runes)
        await this._setting.set('runesV2', this.settings.runesV2)
      }
    )

    this._ipc.onCall(
      AutoChampionConfigMain.id,
      'updateSummonerSpells',
      async (championId: number, key: string, spells: SummonerSpellsConfig | null) => {
        this.settings.updateSummonerSpells(championId, key, spells)
        await this._setting.set('summonerSpells', this.settings.summonerSpells)
      }
    )
  }

  async onInit() {
    await this._setting.applyToState()

    this._mobx.propSync(AutoChampionConfigMain.id, 'settings', this.settings, [
      'enabled',
      'runesV2',
      'summonerSpells'
    ])

    this._handleIpcCall()
  }
}
