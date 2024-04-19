import { initEncounteredGamesStorageIpc } from './encountered-games'
import { initSavedPlayersStorageIpc } from './saved-player'

export function initStorageIpc() {
  initSavedPlayersStorageIpc()
  initEncounteredGamesStorageIpc()
}
