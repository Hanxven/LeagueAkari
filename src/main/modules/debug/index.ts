import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'

import { LcuConnectionModule } from '../lcu-connection'
import { AppLogger, LogModule } from '../log'
import { DebugState } from './state'

export class DebugModule extends MobxBasedBasicModule {
  public state = new DebugState()

  private _logger: AppLogger
  private _lcm: LcuConnectionModule

  constructor() {
    super('debug')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('debug')
    this._lcm = this.manager.getModule('lcu-connection')

    this._setupStateSync()
    this._setupMethodCall()

    this._lcm.lcuEventBus.on('/**', (data) => {
      if (this.state.settings.sendAllNativeLcuEvents) {
        this.sendEvent('lcu-event', data)
      }
    })

    this._logger.info('初始化完成')
  }

  private _setupStateSync() {
    this.getterSync(
      'settings/send-all-native-lcu-events',
      () => this.state.settings.sendAllNativeLcuEvents
    )
  }

  private _setupMethodCall() {
    this.onCall('set-setting/send-all-native-lcu-events', async (enabled) => {
      if (enabled) {
        this._logger.info('Sending all LCU events')
      } else {
        this._logger.info('Stop sending all LCU event')
      }

      this.state.settings.setSendAllNativeLcuEvents(enabled)
    })
  }
}

export const debugModule = new DebugModule()
