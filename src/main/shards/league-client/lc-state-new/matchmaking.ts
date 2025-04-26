import { GetSearch, ReadyCheck } from '@shared/types/league-client/matchmaking'
import { makeAutoObservable, observable } from 'mobx'

export class MatchmakingState {
  readyCheck: ReadyCheck | null = null
  search: GetSearch | null = null

  constructor() {
    makeAutoObservable(this, { readyCheck: observable.struct, search: observable.struct })
  }

  setReadyCheck(readyCheck: ReadyCheck | null) {
    this.readyCheck = readyCheck
  }

  setSearch(search: GetSearch | null) {
    this.search = search
  }
}
