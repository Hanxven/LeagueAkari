import { lcuEventBus } from '@main/core-modules/lcu-connection'
import { ipcStateSync } from '@main/utils/ipc'
import { GetSearch, ReadyCheck } from '@shared/types/lcu/matchmaking'
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
