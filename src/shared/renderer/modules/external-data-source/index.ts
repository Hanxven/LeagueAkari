import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

import { useExternalDataSourceStore } from './store'

export class ExternalDataSourceRendererModule extends StateSyncModule {
  constructor() {
    super('external-data-source')
  }

  override async setup() {
    await super.setup()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useExternalDataSourceStore()

    this.simpleSync('balance/data', (s) => (store.balanceData = s))
  }
}

export const externalDataSourceRendererModule = new ExternalDataSourceRendererModule()
