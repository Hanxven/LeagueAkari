import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcMain } from '../ipc'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { OngoingGameMain } from '../ongoing-game'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { InGameSendSettings, InGameSendState } from './state'

/**
 * 用于在游戏中模拟发送的相关功能
 *  - 游戏内发送消息
 *  - 英雄选择阶段发送消息
 */
export class InGameSendMain implements IAkariShardInitDispose {
  static id = 'in-game-send-main'
  static dependencies = [
    'akari-ipc-main',
    'mobx-utils-main',
    'logger-factory-main',
    'setting-factory-main',
    'keyboard-shortcuts-main',
    'ongoing-game-main'
  ]

  private _loggerFactory: LoggerFactoryMain
  private _settingFactory: SettingFactoryMain
  private _log: AkariLogger
  private _mobx: MobxUtilsMain
  private _ipc: AkariIpcMain
  private _setting: SetterSettingService
  private _kbd: KeyboardShortcutsMain
  private _ongoingGame: OngoingGameMain

  public readonly settings = new InGameSendSettings()
  public readonly state = new InGameSendState()

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._settingFactory = deps['setting-factory-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._kbd = deps['keyboard-shortcuts-main']
    this._ongoingGame = deps['ongoing-game-main']
    this._log = this._loggerFactory.create(InGameSendMain.id)
    this._setting = this._settingFactory.create(
      InGameSendMain.id,
      {
        customSend: { default: this.settings.customSend },
        sendKdaShortcut: { default: this.settings.sendKdaShortcut }
      },
      this.settings
    )
  }

  private async _handleState() {
    await this._setting.applyToState()

    // this._kbd.events.on('shortcut', (e) => {
    //   this._log.info('快捷键', e.id, e.unifiedId)
    // })
  }

  async onInit() {
    await this._handleState()
  }
}
