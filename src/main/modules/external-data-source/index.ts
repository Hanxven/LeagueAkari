import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'

import { AppLogger, LogModule } from '../akari-core/log'
import { BalanceEds } from './fandom'
import { GtimgEds } from './gtimg'
import { SgpEds } from './sgp'

export class ExternalDataSourceModule extends MobxBasedBasicModule {
  private _logger: AppLogger

  private _balance = new BalanceEds(this)

  private _sgp = new SgpEds(this)

  private _gtimg = new GtimgEds(this)

  /**
   * make it public for sub-modules
   */
  get logger() {
    return this._logger
  }

  get balance() {
    return this._balance
  }

  get sgp() {
    return this._sgp
  }

  get ss() {
    return this._ss
  }

  constructor() {
    super('external-data-source')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('external-data-source')

    await this._balance.setup()
    await this._sgp.setup()
    await this._gtimg.setup()

    this._logger.info('初始化完成')
  }
}

export const externalDataSourceModule = new ExternalDataSourceModule()
