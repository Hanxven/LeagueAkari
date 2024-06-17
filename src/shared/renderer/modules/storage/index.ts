import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

export class StorageRendererModule extends StateSyncModule {
  constructor() {
    super('storage')
  }

  override async setup() {
    await super.setup()
  }

  queryEncounteredGames(query: object) {
    return this.call('query/encountered-games', query)
  }

  saveEncounteredGame(dto: object) {
    return this.call('save/encountered-game', dto)
  }

  saveSavedPlayer(query: object) {
    return this.call('save/saved-player', query)
  }

  deleteSavedPlayer(query: object) {
    return this.call('delete/saved-player', query)
  }

  querySavedPlayer(query: object) {
    return this.call('query/saved-player', query)
  }

  querySavedPlayerWithGames(query: object) {
    return this.call('query/saved-player-with-games', query)
  }
}

export const storageRendererModule = new StorageRendererModule()
