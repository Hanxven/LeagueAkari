import { Lobby as LobbyType } from '@shared/types/lcu/lobby'
import { makeAutoObservable, observable } from 'mobx'


export class LobbyState {
  lobby: LobbyType | null = null

  constructor() {
    makeAutoObservable(this, { lobby: observable.struct })
  }

  setLobby(lobby: LobbyType | null) {
    this.lobby = lobby
  }
}
