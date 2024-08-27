import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

export class OpggRendererModule extends StateSyncModule {
  constructor() {
    super('opgg-fe', true)
  }

  override async setup() {
    await super.setup()

    this._handleAutoApply()
  }

  private _handleAutoApply() {}
}

export const opggRendererModule = new OpggRendererModule()