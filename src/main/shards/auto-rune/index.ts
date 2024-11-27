import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoRuneSettings, AutoRuneState } from './state'

/**
 * [暂未实装]
 * 自动符文
 */
export class AutoRuneMain implements IAkariShardInitDispose {
  static id = 'auto-rune-main'
  static dependencies = [
    'mobx-utils-main',
    'akari-ipc-main',
    'setting-factory-main',
    'logger-factory-main'
  ]

  public readonly state = new AutoRuneState()
  public readonly settings = new AutoRuneSettings()

  private readonly _settingFactory: SettingFactoryMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _ipc: AkariIpcMain
  private readonly _mobx: MobxUtilsMain
  private readonly _setting: SetterSettingService
  private readonly _log: AkariLogger

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._settingFactory = deps['setting-factory-main']
    this._mobx = deps['mobx-utils-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(AutoRuneMain.id)
    this._setting = this._settingFactory.create(AutoRuneMain.id, {}, this.settings)
  }

  async onInit() {}

  async onDispose() {}
}
