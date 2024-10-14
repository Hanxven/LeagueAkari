import { makeAutoObservable, observable } from 'mobx'

import { LeagueClientSyncedData } from '../league-client/data'

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
  info: {
    timeLeft: number
    totalTime: number
    isDead: boolean
  } = {
    timeLeft: 0,
    totalTime: 0,
    isDead: false
  }

  settings = new RespawnTimerSettings()

  /**
   * 依赖于 LeagueClientSyncedData 的计算属性
   */
  get selfChampionInGameSelection() {
    if (!this._lcData.gameflow.session || !this._lcData.summoner.me) {
      return null
    }

    const self = [
      ...this._lcData.gameflow.session.gameData.teamOne,
      ...this._lcData.gameflow.session.gameData.teamTwo
    ].find((v) => v.summonerId === this._lcData.summoner.me!.summonerId)

    return self?.championId ?? null
  }

  constructor(private readonly _lcData: LeagueClientSyncedData) {
    makeAutoObservable(this, {
      info: observable.struct
    })
  }
}
