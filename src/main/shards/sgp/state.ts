import { AvailableServersMap } from '@shared/data-sources/sgp'
import { makeAutoObservable } from 'mobx'

import { LeagueClientSyncedData } from '../league-client/lc-state'

export class SgpState {
  availability = {
    region: '',
    rsoPlatform: '',
    sgpServerId: '',
    serversSupported: {
      matchHistory: false,
      common: false
    },
    sgpServers: {
      servers: {},
      tencentServerMatchHistoryInteroperability: [],
      tencentServerSpectatorInteroperability: [],
      tencentServerSummonerInteroperability: []
    } as AvailableServersMap
  }

  setAvailability(
    region: string,
    rsoPlatform: string,
    sgpServerId: string,
    serversSupported: {
      matchHistory: boolean
      common: boolean
    },
    sgpServers: AvailableServersMap
  ) {
    this.availability = {
      region,
      rsoPlatform,
      sgpServerId,
      serversSupported,
      sgpServers
    }
  }

  get isTokenReady() {
    if (this._lcData.lolLeagueSession.token && this._lcData.entitlements.token) {
      return true
    }

    return false
  }

  constructor(private readonly _lcData: LeagueClientSyncedData) {
    makeAutoObservable(this)
  }
}
