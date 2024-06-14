import { lcuEventBus } from '@main/modules/akari-core/lcu-connection'
import { ipcStateSync } from '@main/utils/ipc'
import { GetSearch, ReadyCheck } from '@shared/types/lcu/matchmaking'
import { makeAutoObservable, observable } from 'mobx'

class MatchmakingState {
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

export const matchmaking = new MatchmakingState()

export function matchmakingSync() {
  ipcStateSync('lcu/matchmaking/ready-check', () => matchmaking.readyCheck)
  ipcStateSync('lcu/matchmaking/search', () => matchmaking.search)

  lcuEventBus.on('/lol-matchmaking/v1/ready-check', (event) => {
    matchmaking.setReadyCheck(event.data)
  })

  lcuEventBus.on('/lol-matchmaking/v1/search', (event) => {
    matchmaking.setSearch(event.data)
  })
}
