import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'

import { AppModule } from '../app'
import { AutoGameflowModule } from '../auto-gameflow'
import { AutoReplyModule } from '../auto-reply'
import { AutoSelectModule } from '../auto-select'
import { AutoUpdateModule } from '../auto-update'
import { CoreFunctionalityModule } from '../core-functionality'
import { LcuConnectionModule } from '../lcu-connection'
import { AppLogger, LogModule } from '../log'
import { MainWindowModule } from '../main-window'
import { RespawnTimerModule } from '../respawn-timer'

export class SettingsMigrateModule extends MobxBasedBasicModule {
  private _am: AppModule
  private _logModule: LogModule
  private _logger: AppLogger
  private _rLogger: AppLogger
  private _mwm: MainWindowModule
  private _afgm: AutoGameflowModule
  private _arm: AutoReplyModule
  private _cfm: CoreFunctionalityModule
  private _asm: AutoSelectModule
  private _rtm: RespawnTimerModule
  private _lcm: LcuConnectionModule
  private _aum: AutoUpdateModule

  constructor() {
    super('settings-migrate')
  }

  override async setup() {
    await super.setup()

    this._am = this.manager.getModule<AppModule>('app')
    this._logModule = this.manager.getModule<LogModule>('log')
    this._logger = this._logModule.createLogger('app')
    this._rLogger = this._logModule.createLogger('renderer')
    this._mwm = this.manager.getModule<MainWindowModule>('main-window')
    this._afgm = this.manager.getModule<AutoGameflowModule>('auto-gameflow')
    this._arm = this.manager.getModule<AutoReplyModule>('auto-reply')
    this._cfm = this.manager.getModule<CoreFunctionalityModule>('core-functionality')
    this._asm = this.manager.getModule<AutoSelectModule>('auto-select')
    this._rtm = this.manager.getModule<RespawnTimerModule>('respawn-timer')
    this._lcm = this.manager.getModule<LcuConnectionModule>('lcu-connection')
    this._aum = this.manager.getModule<AutoUpdateModule>('auto-update')

    this._setupMethodCall()

    await this._migrateSettingsToDotProps()

    this._logger.info('初始化完成')
  }

  private _setupMethodCall() {}

  // from v1.2.x -> v1.2.5
  // 该版本将不再考虑远古 1.1.x 版本的设置迁移
  private async _migrateSettingsToDotProps() {
    const isInPropsStage = await this._sm.settings.get('akari.inDotPropsStage', false)
    if (isInPropsStage) {
      return
    }
  }
}

export const settingsMigrateModule = new SettingsMigrateModule()
