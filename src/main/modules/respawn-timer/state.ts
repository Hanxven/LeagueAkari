import { makeAutoObservable } from 'mobx'

import { lcuSyncModule as lcu } from '../lcu-state-sync'

class RespawnTimerSettings {
  enabled: boolean = false

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class RespawnTimerState {
  timeLeft: number = 0
  totalTime: number = 0
  isDead: boolean = false

  settings = new RespawnTimerSettings()

  constructor() {
    makeAutoObservable(this)
  }

  get selfChampionInGameSelection() {
    if (!lcu.gameflow.session || !lcu.summoner.me) {
      return null
    }

    const self = [
      ...lcu.gameflow.session.gameData.teamOne,
      ...lcu.gameflow.session.gameData.teamTwo
    ].find((v) => v.summonerId === lcu.summoner.me!.summonerId)

    return self?.championId ?? null
  }
}

export const respawnTimerState = new RespawnTimerState()
