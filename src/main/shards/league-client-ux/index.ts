import { queryUxCommandLine, queryUxCommandLineNative } from '@main/utils/ux-cmd'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { LeagueClientUxSettings, LeagueClientUxState } from './state'

/**
 * 对于 League Client Ux 进程的相关工具集, 比如检测命令行
 */
export class LeagueClientUxMain implements IAkariShardInitDispose {
  static id = 'league-client-ux-main'
  static dependencies = [
    AkariIpcMain.id,
    MobxUtilsMain.id,
    AppCommonMain.id,
    LoggerFactoryMain.id,
    SettingFactoryMain.id
  ]

  static UX_PROCESS_NAME = 'LeagueClientUx.exe'
  static CLIENT_CMD_DEFAULT_POLL_INTERVAL = 2000
  static CLIENT_CMD_LONG_POLL_INTERVAL = 8000

  private _pollInterval = LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL

  public readonly settings = new LeagueClientUxSettings()
  public readonly state = new LeagueClientUxState()

  private readonly _ipc: AkariIpcMain
  private readonly _common: AppCommonMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _mobx: MobxUtilsMain
  private readonly _setting: SetterSettingService

  private _pollTimerId: NodeJS.Timeout | null = null

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._common = deps['app-common-main']
    this._loggerFactory = deps['logger-factory-main']
    this._mobx = deps['mobx-utils-main']
    this._settingFactory = deps['setting-factory-main']
    this._log = this._loggerFactory.create(LeagueClientUxMain.id)
    this._setting = this._settingFactory.register(
      LeagueClientUxMain.id,
      {
        useWmic: { default: this.settings.useWmic }
      },
      this.settings
    )
  }

  async onInit() {
    this._handlePollExistingUx()

    await this._setting.applyToState()
    this._mobx.propSync(LeagueClientUxMain.id, 'settings', this.settings, ['useWmic'])
    this._mobx.propSync(LeagueClientUxMain.id, 'state', this.state, ['launchedClients'])
  }

  async onDispose() {
    if (this._pollTimerId) {
      clearInterval(this._pollTimerId)
      this._pollTimerId = null
    }
  }

  setPollInterval(interval: number, immediate = false) {
    this._pollInterval = interval
    if (this._pollTimerId) {
      clearInterval(this._pollTimerId)

      if (immediate) {
        this.update()
      }

      this._pollTimerId = setInterval(() => this.update(), interval)
    }
  }

  private _handlePollExistingUx() {
    this.update()
    this._pollTimerId = setInterval(
      () => this.update(),
      LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL
    )
  }

  /**
   * 立即更新状态
   */
  async update() {
    try {
      this.state.setLaunchedClients(await this._queryUxCommandLine())

      if (this._pollTimerId) {
        clearInterval(this._pollTimerId)
      }
      this._pollTimerId = setInterval(
        () => this.update(),
        LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL
      )
    } catch (error) {
      this._ipc.sendEvent(LeagueClientUxMain.id, 'error-polling')
      this._log.error(`获取 Ux 命令行信息时失败`, error)
    }
  }

  private _queryUxCommandLine() {
    if (this.settings.useWmic) {
      if (!this._common.state.isAdministrator) {
        return []
      }

      return queryUxCommandLine(LeagueClientUxMain.UX_PROCESS_NAME)
    }

    return queryUxCommandLineNative(LeagueClientUxMain.UX_PROCESS_NAME)
  }
}
