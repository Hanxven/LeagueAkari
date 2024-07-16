import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { sleep } from '@shared/utils/sleep'

import { LeagueClientModule } from '../akari-core/league-client'
import { AppLogger, LogModule } from '../akari-core/log'
import { PlatformModule } from '../akari-core/platform'
import { LcuSyncModule } from '../lcu-state-sync'
import { CustomKeyboardSequenceState } from './state'

export class CustomKeyboardSequenceModule extends MobxBasedBasicModule {
  public state = new CustomKeyboardSequenceState()

  private _isSending = false

  private _logger: AppLogger
  private _pm: PlatformModule
  private _lcu: LcuSyncModule
  private _lcm: LeagueClientModule

  constructor() {
    super('custom-keyboard-sequence')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('log')
    this._pm = this.manager.getModule('win-platform')
    this._lcu = this.manager.getModule('lcu-state-sync')
    this._lcm = this.manager.getModule('league-client')

    await this._setupSettingsSync()

    this._handleCks()

    this._logger.info('初始化完成')
  }

  private async _sendCustomSequence() {
    if (this._isSending) {
      return
    }

    this._isSending = true

    const texts = this.state.settings.text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const tasks: (() => Promise<void>)[] = []
    for (let i = 0; i < texts.length; i++) {
      tasks.push(async () => {
        this._pm.sendKey(13, true)
        this._pm.sendKey(13, false)
        await sleep(65)
        this._pm.sendInputString(texts[i])
        await sleep(65)
        this._pm.sendKey(13, true)
        this._pm.sendKey(13, false)
      })

      if (i !== texts.length - 1) {
        tasks.push(() => sleep(65))
      }
    }

    for (const t of tasks) {
      if (this._isSending) {
        await t()
      }
    }

    this._isSending = false
  }

  private _handleCks() {
    this._pm.bus.on('global-shortcut/delete', () => {
      if (this.state.settings.enabled) {
        if (this._isSending) {
          this._isSending = false
          return
        }

        if (!this._lcm.isGameClientForeground()) {
          return
        }

        this._sendCustomSequence()
      }
    })
  }

  private async _setupSettingsSync() {
    this.simpleSettingSync(
      'enabled',
      () => this.state.settings.enabled,
      (s) => this.state.settings.setEnabled(s)
    )
    this.simpleSettingSync(
      'text',
      () => this.state.settings.text,
      (s) => this.state.settings.setText(s)
    )

    await this.loadSettings()
  }
}

export const customKeyboardSequenceModule = new CustomKeyboardSequenceModule()
