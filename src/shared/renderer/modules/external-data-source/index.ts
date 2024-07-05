import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

import { useExternalDataSourceStore } from './store'

class SgpEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {}
}

class BalanceEdsRenderer {
  constructor(private _edsm: ExternalDataSourceRendererModule) {}

  async setup() {
    const store = useExternalDataSourceStore()

    this._edsm.simpleSync('balance/data', (s) => (store.balanceData = s))
  }
}

export class ExternalDataSourceRendererModule extends StateSyncModule {
  sgp = new SgpEdsRenderer(this)
  balance = new BalanceEdsRenderer(this)

  constructor() {
    super('external-data-source')
  }

  override async setup() {
    await super.setup()

    await this.sgp.setup()
    await this.balance.setup()
  }
}

export const externalDataSourceRendererModule = new ExternalDataSourceRendererModule()
