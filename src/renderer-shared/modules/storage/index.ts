import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

export class StorageRendererModule extends StateSyncModule {
  constructor() {
    super('storage')
  }

  override async setup() {
    await super.setup()
  }

  queryEncounteredGames(query: object) {
    return this.call('query/players/encountered-games', query)
  }

  saveEncounteredGame(dto: object) {
    return this.call('save/players/encountered-game', dto)
  }

  saveSavedPlayer(query: object) {
    return this.call('save/players/saved-player', query)
  }

  deleteSavedPlayer(query: object) {
    return this.call('delete/players/saved-player', query)
  }

  querySavedPlayer(query: object) {
    return this.call('query/players/saved-player', query)
  }

  querySavedPlayerWithGames(query: object) {
    return this.call('query/players/saved-player-with-games-with-games', query)
  }
}

export const storageRendererModule = new StorageRendererModule()
