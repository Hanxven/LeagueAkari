import {
  MobxBasedBasicModule,
  RegisteredSettingHandler
} from '@main/akari-ipc/mobx-based-basic-module'
import { sleep } from '@shared/utils/sleep'
import { Paths } from '@shared/utils/types'
import { set } from 'lodash'
import { runInAction } from 'mobx'

import { LeagueClientModule } from '../league-client'
import { AppLogger, LogModule } from '../log'
import { PlatformModule } from '../win-platform'
import { CustomKeyboardSequenceState } from './state'

export class CustomKeyboardSequenceModule extends MobxBasedBasicModule {
  public state = new CustomKeyboardSequenceState()

  private _isSending = false

  private _logger: AppLogger
  private _pm: PlatformModule
  private _lcm: LeagueClientModule

  constructor() {
    super('custom-keyboard-sequence')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('log')
    this._pm = this.manager.getModule('win-platform')
    this._lcm = this.manager.getModule('league-client')

    await this._setupSettings()

    this._setupStateSync()
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

  private _setupStateSync() {
    this.propSync('state', this.state, ['settings.enabled', 'settings.text'])
  }

  private async _setupSettings() {
    this.registerSettings([
      {
        key: 'enabled',
        defaultValue: this.state.settings.enabled
      },
      {
        key: 'text',
        defaultValue: this.state.settings.text
      }
    ])

    const settings = await this.readSettings()
    runInAction(() => {
      settings.forEach((s) => set(this.state.settings, s.settingItem, s.value))
    })

    const defaultSetter: RegisteredSettingHandler = async (key, value, apply) => {
      runInAction(() => set(this.state.settings, key, value))
      await apply(key, value)
    }

    this.onSettingChange<Paths<typeof this.state.settings>>('enabled', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('text', defaultSetter)
  }
}

export const customKeyboardSequenceModule = new CustomKeyboardSequenceModule()
