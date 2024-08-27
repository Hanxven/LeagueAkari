import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'

import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { AppLogger, LogModule } from '../akari-core/log'
import { BalanceEds } from './fandom'
import { GtimgEds } from './gtimg'
import { OpggEds } from './opgg'
import { SgpEds } from './sgp'

export class ExternalDataSourceModule extends MobxBasedBasicModule {
  private _logger: AppLogger
  private _lcm: LcuConnectionModule

  private _balance = new BalanceEds(this)

  private _sgp = new SgpEds(this)

  private _gtimg = new GtimgEds(this)

  private _opgg = new OpggEds(this)

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

  get opgg() {
    return this._opgg
  }

  get ss() {
    return this._ss
  }

  get lcm() {
    return this._lcm
  }

  constructor() {
    super('data-sources')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('data-sources')
    this._lcm = this.manager.getModule<LcuConnectionModule>('lcu-connection')

    await this._balance.setup()
    await this._sgp.setup()
    await this._gtimg.setup()
    await this._opgg.setup()

    this._logger.info('初始化完成')
  }
}

export const externalDataSourceModule = new ExternalDataSourceModule()
