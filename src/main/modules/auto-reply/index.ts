import { chatSend } from '@main/http-api/chat'
import { MobxBasedModule } from '@main/akari-ipc/mobx-based-module'
import { ChatMessage } from '@shared/types/lcu/chat'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'

import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { AppLogger, LogModule } from '../akari-core/log'
import { MainWindowModule } from '../akari-core/main-window'
import { StorageModule } from '../akari-core/storage'
import { LcuSyncModule } from '../lcu-state-sync'
import { AutoReplyState } from './state'

export class AutoReplyModule extends MobxBasedModule {
  public state = new AutoReplyState()

  private _storageModule: StorageModule
  private _logger: AppLogger
  private _mwm: MainWindowModule
  private _lcu: LcuSyncModule
  private _lcm: LcuConnectionModule

  constructor() {
    super('auto-reply')
  }

  override async setup() {
    await super.setup()

    this._storageModule = this.manager.getModule('storage')
    this._mwm = this.manager.getModule('main-window')
    this._lcu = this.manager.getModule('lcu-state-sync')
    this._lcm = this.manager.getModule('lcu-connection')
    this._logger = this.manager.getModule<LogModule>('log').createLogger('auto-reply')

    await this._loadSettings()
    this._setupMethodCall()
    this._setupStateSync()
    this._handleAutoReply()

    this._logger.info('初始化完成')
  }

  private _handleAutoReply() {
    this._lcm.lcuEventBus.on<LcuEvent<ChatMessage>>(
      '/lol-chat/v1/conversations/:fromId/messages/:messageId',
      async (event, { fromId }) => {
        if (
          this.state.settings.enabled &&
          event.data &&
          this._lcu.summoner.me &&
          event.data.type === 'chat' &&
          event.data.fromSummonerId !== this._lcu.summoner.me.summonerId &&
          this.state.settings.text
        ) {
          if (this.state.settings.enableOnAway && this._lcu.chat.me?.availability !== 'away') {
            return
          }

          try {
            await chatSend(fromId, this.state.settings.text)
          } catch (error) {
            this._mwm.notify.warn('auto-reply', '自动回复', '无法发送信息')
            this._logger.warn(`尝试自动回复时出现错误 ${formatError(error)}`)
          }
        }
      }
    )
  }

  private _setupMethodCall() {
    this.onCall('set-setting/enabled', async (enabled) => {
      this.state.settings.setEnabled(enabled)
      await this._storageModule.settings.set('auto-reply/enabled', enabled)
    })

    this.onCall('set-setting/enable-on-away', async (enabled) => {
      this.state.settings.setEnableOnAway(enabled)
      await this._storageModule.settings.set('auto-reply/enable-on-away', enabled)
    })

    this.onCall('set-setting/text', async (text) => {
      this.state.settings.setText(text)
      await this._storageModule.settings.set('auto-reply/text', text)
    })
  }

  private _setupStateSync() {
    this.simpleSync('settings/enabled', () => this.state.settings.enabled)
    this.simpleSync('settings/enable-on-away', () => this.state.settings.enableOnAway)
    this.simpleSync('settings/text', () => this.state.settings.text)
  }

  private async _loadSettings() {
    this.state.settings.setEnabled(
      await this._storageModule.settings.get('auto-reply/enabled', this.state.settings.enabled)
    )

    this.state.settings.setEnableOnAway(
      await this._storageModule.settings.get(
        'auto-reply/enable-on-away',
        this.state.settings.enableOnAway
      )
    )

    this.state.settings.setText(
      await this._storageModule.settings.get('auto-reply/text', this.state.settings.text)
    )
  }
}

export const autoReplyModule = new AutoReplyModule()
