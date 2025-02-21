import { SpectatorData } from '@shared/data-sources/sgp/types'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { makeAutoObservable, observable } from 'mobx'

import { SgpState } from '../sgp/state'

export interface StalkedPlayer {
  enabled: boolean
  puuid: string
  sgpServerId: string
}

export class PlayerStalkingSettings {
  /**
   * 总开关
   */
  enabled: boolean = true
  /**
   * puuid 列表
   */
  playersToStalk: StalkedPlayer[] = []

  /**
   * 轮询间隔 (秒)
   */
  pollIntervalSeconds: number = 60

  setEnabled(s: boolean) {
    this.enabled = s
  }

  setPlayersToStalk(s: StalkedPlayer[]) {
    this.playersToStalk = s
  }

  setPollIntervalSeconds(s: number) {
    this.pollIntervalSeconds = s
  }

  constructor() {
    makeAutoObservable(this, {
      playersToStalk: observable.ref
    })
  }
}

export interface PlayerTracking {
  summoner: SummonerInfo | null
  spectator: SpectatorData | null
  lastUpdated: number
}

export class PlayerStalkingState {
  tracking: Record<string, PlayerTracking> = {}

  timers: Map<string, NodeJS.Timeout> = new Map()

  setTimer(puuid: string, timer: NodeJS.Timeout) {
    this.timers.set(puuid, timer)
  }

  updatePlayer(puuid: string, tracking: PlayerTracking | null) {
    if (tracking === null) {
      const { [puuid]: _, ...rest } = this.tracking
      this.tracking = rest
    } else {
      this.tracking = { ...this.tracking, [puuid]: tracking }
    }
  }

  clearTracking() {
    this.tracking = {}
  }

  clearTimers() {
    for (const [_, timer] of this.timers) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }

  clearTimer(puuid: string) {
    const timer = this.timers.get(puuid)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(puuid)
    }
  }

  get isSgpAvailable() {
    return this._sgpState.availability.serversSupported.common && this._sgpState.isTokenReady
  }

  constructor(private readonly _sgpState: SgpState) {
    makeAutoObservable(this, {
      timers: observable.shallow,
      tracking: observable.ref
    })
  }
}
