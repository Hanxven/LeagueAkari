import { makeAutoObservable, observable } from 'mobx'

import { LeagueClientData } from '../league-client/lc-state'

export class RespawnTimerSettings {
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

  /**
   * 依赖于 LeagueClientData 的计算属性
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

  constructor(private readonly _lcData: LeagueClientData) {
    makeAutoObservable(this, {
      info: observable.struct
    })
  }
}
