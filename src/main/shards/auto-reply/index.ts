import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { ChatMessage } from '@shared/types/league-client/chat'
import { LcuEvent } from '@shared/types/league-client/event'
import { formatError } from '@shared/utils/errors'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoReplySettings } from './state'

/**
 * 聊天自动回复相关功能
 */
export class AutoReplyMain implements IAkariShardInitDispose {
  static id = 'auto-reply-main'
  static dependencies = [
    LoggerFactoryMain.id,
    SettingFactoryMain.id,
    LeagueClientMain.id,
    AkariIpcMain.id,
    MobxUtilsMain.id
  ]

  public readonly settings = new AutoReplySettings()

  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _lc: LeagueClientMain
  private readonly _setting: SetterSettingService
  private readonly _mobx: MobxUtilsMain
  private readonly _ipc: AkariIpcMain

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(AutoReplyMain.id)
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._settingFactory = deps['setting-factory-main']
    this._setting = this._settingFactory.register(
      AutoReplyMain.id,
      {
        enabled: { default: this.settings.enabled },
        enableOnAway: { default: this.settings.enableOnAway },
        text: { default: this.settings.text }
      },
      this.settings
    )
  }

  async onInit() {
    await this._setting.applyToState()
    this._mobx.propSync(AutoReplyMain.id, 'settings', this.settings, [
      'enabled',
      'enableOnAway',
      'text'
    ])

    // 原始人的方法！
    this._lc.events.on<LcuEvent<ChatMessage>>(
      '/lol-chat/v1/conversations/:fromId/messages/:messageId',
      async (event, { fromId }) => {
        if (
          this.settings.enabled &&
          event.data &&
          this._lc.data.summoner.me &&
          event.data.type === 'chat' &&
          event.data.fromSummonerId !== this._lc.data.summoner.me.summonerId &&
          this.settings.text
        ) {
          if (this.settings.enableOnAway && this._lc.data.chat.me?.availability !== 'away') {
            return
          }

          try {
            await this._lc.api.chat.chatSend(fromId, this.settings.text)
            this._log.info(`已自动回复给 ${fromId}, 内容: ${this.settings.text}`)
          } catch (error) {
            this._ipc.sendEvent(AutoReplyMain.id, 'error-send-failed', {
              error: formatError(error)
            })
            this._log.warn(`尝试自动回复时出现错误`, formatError(error))
          }
        }
      }
    )
  }
}
