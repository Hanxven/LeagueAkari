import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { SgpMain } from '../sgp'
import { OngoingGameSettings, OngoingGameState } from './state'

/**
 * 用于游戏过程中的对局分析, 包括在此期间的战绩查询, 计算等
 */
export class OngoingGameMain implements IAkariShardInitDispose {
  static id = 'ongoing-game-main'
  static dependencies = [
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main',
    'akari-ipc-main',
    'mobx-utils-main',
    'sgp-main'
  ]

  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _lc: LeagueClientMain
  private readonly _setting: MobxSettingService
  private readonly _mobx: MobxUtilsMain
  private readonly _ipc: AkariIpcMain
  private readonly _sgp: SgpMain

  public readonly settings = new OngoingGameSettings()
  public readonly state: OngoingGameState

  private _grabTimerId: NodeJS.Timeout | null = null

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(OngoingGameMain.id)
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._settingFactory = deps['setting-factory-main']
    this._sgp = deps['sgp-main']
    this._setting = this._settingFactory.create(
      OngoingGameMain.id,
      {
        concurrency: { default: this.settings.concurrency },
        enabled: { default: this.settings.enabled },
        matchHistoryLoadCount: { default: this.settings.matchHistoryLoadCount },
        orderPlayerBy: { default: this.settings.orderPlayerBy },
        preMadeTeamThreshold: { default: this.settings.preMadeTeamThreshold },
        matchHistoryUseSgpApi: { default: this.settings.matchHistoryUseSgpApi }
      },
      this.settings
    )
    this.state = new OngoingGameState(this._lc.data)
  }

  private async _handleState() {
    await this._setting.applyToState()
    this._mobx.propSync(OngoingGameMain.id, 'settings', this.settings, [
      'concurrency',
      'enabled',
      'matchHistoryLoadCount',
      'orderPlayerBy',
      'preMadeTeamThreshold',
      'matchHistoryUseSgpApi'
    ])
    this._mobx.propSync(OngoingGameMain.id, 'state', this.state, [
      'championSelections',
      'gameInfo',
      'positionAssignments',
      'teams',
      'queryStage',
      'premadeTeams'
    ])
  }

  async onInit() {
    await this._handleState()
  }
}
