import { MobxBasedModule } from '@shared/akari/mobx-based-module'
import { sleep } from '@shared/utils/sleep'

import { AppLogger, LogModule } from '../akari-core/log'
import { PlatformModule } from '../akari-core/platform'
import { StorageModule } from '../akari-core/storage'
import { LcuSyncModule } from '../lcu-state-sync'
import { CustomKeyboardSequenceState } from './state'

export class CustomKeyboardSequenceModule extends MobxBasedModule {
  public state = new CustomKeyboardSequenceState()

  private _isSending = false

  private _logger: AppLogger
  private _storageModule: StorageModule
  private _pm: PlatformModule
  private _lcu: LcuSyncModule

  constructor() {
    super('custom-keyboard-sequence')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('log')
    this._storageModule = this.manager.getModule('storage')
    this._pm = this.manager.getModule('win-platform')
    this._lcu = this.manager.getModule('lcu-state-sync')

    await this._loadSettings()
    this._setupStateSync()
    this._setupMethodCall()

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

  private _setupStateSync() {
    this.simpleSync('settings/enabled', () => this.state.settings.enabled)
    this.simpleSync('settings/text', () => this.state.settings.text)
  }

  private _handleCks() {
    this._pm.bus.on('global-shortcut/delete', () => {
      if (this.state.settings.enabled) {
        if (this._isSending) {
          this._isSending = false
        } else {
          this._sendCustomSequence()
        }
      }
    })
  }

  private _setupMethodCall() {
    this.onCall('set-setting/enabled', async (enabled) => {
      this.state.settings.setEnabled(enabled)
      await this._storageModule.setSetting('custom-keyboard-sequence/enabled', enabled)
    })

    this.onCall('set-setting/text', async (text) => {
      this.state.settings.setText(text)
      await this._storageModule.setSetting('custom-keyboard-sequence/text', text)
    })
  }

  private async _loadSettings() {
    this.state.settings.setEnabled(
      await this._storageModule.getSetting(
        'custom-keyboard-sequence/enabled',
        this.state.settings.enabled
      )
    )

    this.state.settings.setText(
      await this._storageModule.getSetting(
        'custom-keyboard-sequence/text',
        this.state.settings.text
      )
    )
  }
}

export const customKeyboardSequenceModule = new CustomKeyboardSequenceModule()
