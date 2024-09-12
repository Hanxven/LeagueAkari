import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'

import { LcuConnectionModule } from '../lcu-connection'
import { AppLogger, LogModule } from '../log'
import { OngoingGameState } from './state'

export class OngoingGameModule extends MobxBasedBasicModule {
  public state = new OngoingGameState()

  private _logger: AppLogger
  private _lcm: LcuConnectionModule

  constructor() {
    super('ongoing-game')
  }

  override async setup() {
    await super.setup()

    this._logger.info('初始化完成')
  }

  private _setupStateSync() {}

  private _setupMethodCall() {}
}

export const ongoingGameModule = new OngoingGameModule()
