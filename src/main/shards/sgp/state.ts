import { AvailableServersMap } from '@shared/data-sources/sgp'
import { makeAutoObservable } from 'mobx'

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
      serverNames: {},
      tencentServerMatchHistoryInteroperability: [],
      tencentServerSpectatorInteroperability: [],
      tencentServerSummonerInteroperability: []
    } as AvailableServersMap
  }

  isEntitlementsTokenSet = false

  isLeagueSessionTokenSet = false

  setEntitlementsTokenSet(value: boolean) {
    this.isEntitlementsTokenSet = value
  }

  setLeagueSessionTokenSet(value: boolean) {
    this.isLeagueSessionTokenSet = value
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
    return this.isEntitlementsTokenSet && this.isLeagueSessionTokenSet
  }

  constructor() {
    makeAutoObservable(this)
  }
}
