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

  constructor() {
    makeAutoObservable(this)
  }
}
