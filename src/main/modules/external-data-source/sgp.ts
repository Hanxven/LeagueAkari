import { SgpApi } from '@shared/external-data-source/sgp/match-history'

import { LcuSyncModule } from '../lcu-state-sync'
import { ExternalDataSourceModule } from '.'

export class SgpEds {
  private _lcu: LcuSyncModule
  private _sgp = new SgpApi()

  constructor(private _edsm: ExternalDataSourceModule) {}

  async setup() {
    this._lcu = this._edsm.manager.getModule('lcu-state-sync')

    this._setupMethodCall()
  }

  private _setupMethodCall() {
    this._edsm.onCall('supported-sgp-servers', () => {
      return this._sgp.supportedPlatforms()
    })
  }
}
