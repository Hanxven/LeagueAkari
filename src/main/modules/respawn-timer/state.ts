import { makeAutoObservable } from 'mobx'

import { gameflow } from '../lcu-state-sync/gameflow'
import { summoner } from '../lcu-state-sync/summoner'

class RespawnTimerSettings {
  enabled: boolean = false

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

class RespawnTimerState {
  timeLeft: number = 0
  totalTime: number = 0
  isDead: boolean = false

  settings = new RespawnTimerSettings()

  constructor() {
    makeAutoObservable(this)
  }

  get selfChampionInGameSelection() {
    if (!gameflow.session || !summoner.me) {
      return null
    }

    const self = [...gameflow.session.gameData.teamOne, ...gameflow.session.gameData.teamTwo].find(
      (v) => v.summonerId === summoner.me!.summonerId
    )

    return self?.championId ?? null
  }
}

export const respawnTimerState = new RespawnTimerState()
