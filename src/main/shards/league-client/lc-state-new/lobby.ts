import { Lobby as LobbyType, ReceivedInvitation } from '@shared/types/league-client/lobby'
import { makeAutoObservable, observable } from 'mobx'

export class LobbyState {
  lobby: LobbyType | null = null
  receivedInvitations: ReceivedInvitation[] = []

  constructor() {
    makeAutoObservable(this, { lobby: observable.struct, receivedInvitations: observable.struct })
  }

  setLobby(lobby: LobbyType | null) {
    this.lobby = lobby
  }

  setReceivedInvitations(receivedInvitations: ReceivedInvitation[]) {
    this.receivedInvitations = receivedInvitations
  }
}
