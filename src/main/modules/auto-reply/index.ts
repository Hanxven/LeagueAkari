import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { chatSend } from '@main/http-api/chat'
import { ChatMessage } from '@shared/types/lcu/chat'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'

import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { AppLogger, LogModule } from '../akari-core/log'
import { MainWindowModule } from '../akari-core/main-window'
import { LcuSyncModule } from '../lcu-state-sync'
import { AutoReplyState } from './state'

export class AutoReplyModule extends MobxBasedBasicModule {
  public state = new AutoReplyState()

  private _logger: AppLogger
  private _mwm: MainWindowModule
  private _lcu: LcuSyncModule
  private _lcm: LcuConnectionModule

  constructor() {
    super('auto-reply')
  }

  override async setup() {
    await super.setup()

    this._mwm = this.manager.getModule('main-window')
    this._lcu = this.manager.getModule('lcu-state-sync')
    this._lcm = this.manager.getModule('lcu-connection')
    this._logger = this.manager.getModule<LogModule>('log').createLogger('auto-reply')

    await this._setupSettingsSync()
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

  private async _setupSettingsSync() {
    this.simpleSettingSync(
      'enabled',
      () => this.state.settings.enabled,
      (s) => this.state.settings.setEnabled(s)
    )
    this.simpleSettingSync(
      'enable-on-away',
      () => this.state.settings.enableOnAway,
      (s) => this.state.settings.setEnableOnAway(s)
    )
    this.simpleSettingSync(
      'text',
      () => this.state.settings.text,
      (s) => this.state.settings.setText(s)
    )

    await this.loadSettings()
  }
}

export const autoReplyModule = new AutoReplyModule()
