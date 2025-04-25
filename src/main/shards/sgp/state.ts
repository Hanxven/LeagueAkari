import { LeagueSgpApi, SgpServersConfig } from '@shared/data-sources/sgp'
import { getSgpServerId } from '@shared/data-sources/sgp/utils'
import { makeAutoObservable, observable } from 'mobx'

import { LeagueClientState } from '../league-client/state'

export class SgpState {
  sgpServerConfig: SgpServersConfig = {
    version: 0,
    lastUpdate: 0,
    servers: {},
    serverNames: {},
    tencentServerMatchHistoryInteroperability: [],
    tencentServerSpectatorInteroperability: [],
    tencentServerSummonerInteroperability: []
  }

  get availability() {
    if (!this._lcState.auth) {
      return {
        region: '',
        rsoPlatform: '',
        sgpServerId: '',
        serversSupported: {
          matchHistory: false,
          common: false
        }
      }
    }

    const sgpServerId = getSgpServerId(this._lcState.auth.region, this._lcState.auth.rsoPlatformId)
    const supported = this.sgpServerConfig.servers[sgpServerId.toUpperCase()] || {
      matchHistory: false,
      common: false
    }

    return {
      region: this._lcState.auth.region,
      rsoPlatform: this._lcState.auth.rsoPlatformId,
      sgpServerId,
      serversSupported: {
        matchHistory: supported.matchHistory,
        common: supported.common
      }
    }
  }

  // 用一个标记位来延迟更新
  isEntitlementsTokenSet = false
  isLeagueSessionTokenSet = false

  setEntitlementsTokenSet(value: boolean) {
    this.isEntitlementsTokenSet = value
  }

  setLeagueSessionTokenSet(value: boolean) {
    this.isLeagueSessionTokenSet = value
  }

  setSgpServerConfig(value: SgpServersConfig) {
    this.sgpServerConfig = value
  }

  get isTokenReady() {
    return this.isEntitlementsTokenSet && this.isLeagueSessionTokenSet
  }

  constructor(private _lcState: LeagueClientState) {
    makeAutoObservable(this, {
      sgpServerConfig: observable.ref
    })
  }
}
