import {
  MobxBasedBasicModule,
  RegisteredSettingHandler
} from '@main/akari-ipc/mobx-based-basic-module'
import { chatSend } from '@main/http-api/chat'
import { ChatMessage } from '@shared/types/lcu/chat'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'
import { Paths } from '@shared/utils/types'
import { set } from 'lodash'
import { runInAction } from 'mobx'

import { LcuConnectionModule } from '../lcu-connection'
import { AppLogger, LogModule } from '../log'
import { MainWindowModule } from '../main-window'
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

    await this._setupSettings()

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

  private _setupStateSync() {
    this.propSync('state', this.state, [
      'settings.enabled',
      'settings.enableOnAway',
      'settings.text'
    ])
  }

  private async _setupSettings() {
    this.registerSettings([
      {
        key: 'enabled',
        defaultValue: this.state.settings.enabled
      },
      {
        key: 'enableOnAway',
        defaultValue: this.state.settings.enableOnAway
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
    this.onSettingChange<Paths<typeof this.state.settings>>('enableOnAway', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('text', defaultSetter)
  }
}

export const autoReplyModule = new AutoReplyModule()
