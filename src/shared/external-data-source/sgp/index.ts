import axios from 'axios'
import { AxiosRetry } from 'axios-retry'

import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol,
  SgpRankedStats,
  SgpSummoner
} from './types'

// can only be imported like this
const axiosRetry = require('axios-retry').default as AxiosRetry

export interface AvailableServersMap {
  servers: {
    [region: string]: {
      name: string
      server: string
    }
  }
  groups: string[][]
}

export class SgpApi {
  static USER_AGENT = 'LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-match-history)'

  private _availableSgpServers: AvailableServersMap = {
    servers: {},
    groups: []
  }

  /**
   * SGP API 需要用户登录的 Session
   */
  private _jwtToken: string | null = null
  private _http = axios.create({
    headers: {
      'User-Agent': SgpApi.USER_AGENT
    }
  })

  constructor() {
    axiosRetry(this._http, {
      retries: 3,
      retryDelay: () => 0,
      retryCondition: (error) => {
        return Boolean(error.response)
      }
    })

    this._http.interceptors.request.use((req) => {
      if (!req.headers.Authorization) {
        req.headers.Authorization = `Bearer ${this._jwtToken}`
      }

      return req
    })
  }

  setAvailableSgpServers(servers: AvailableServersMap) {
    this._availableSgpServers = servers
  }

  supportsPlatform(platformId: string) {
    return this._availableSgpServers.servers[platformId.toUpperCase()] !== undefined
  }

  supportedPlatforms() {
    return this._availableSgpServers
  }

  hasJwtToken() {
    return this._jwtToken !== null
  }

  setJwtToken(token: string | null) {
    this._jwtToken = token
    this._http.defaults.headers.Authorization = `Bearer ${this._jwtToken}`
  }

  private _getSgpServerId(platformId: string) {
    const platformSgpServer = this._availableSgpServers.servers[platformId.toUpperCase()]
    if (!platformSgpServer) {
      throw new Error(`unknown platformId: ${platformId}`)
    }

    return platformSgpServer
  }

  getMatchHistory(
    sgpServerId: string,
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string
  ) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._getSgpServerId(sgpServerId)

    return this._http.get<SgpMatchHistoryLol>(
      `/match-history-query/v1/products/lol/player/${playerPuuid}/SUMMARY`,
      {
        baseURL: platformSgpServer.server,
        params: {
          startIndex: start,
          count,
          tag
        }
      }
    )
  }

  getGameSummary(platformId: string, gameId: number) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._getSgpServerId(platformId)

    return this._http.get<SgpGameSummaryLol>(
      `/match-history-query/v1/products/lol/${platformId.toUpperCase()}_${gameId}/SUMMARY`,
      { baseURL: platformSgpServer.server }
    )
  }

  getGameDetails(platformId: string, gameId: number) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._getSgpServerId(platformId)

    return this._http.get<SgpGameDetailsLol>(
      `/match-history-query/v1/products/lol/${platformId.toUpperCase()}_${gameId}/DETAILS`,
      { baseURL: platformSgpServer.server }
    )
  }

  getRankedStatsTencent(platformId: string, puuid: string) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._getSgpServerId(platformId)

    return this._http.get<SgpRankedStats>(`/leagues-ledge/v2/rankedStats/puuid/${puuid}`, {
      baseURL: platformSgpServer.server
    })
  }

  getSummonerByPuuidTencent(platformId: string, puuid: string) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._getSgpServerId(platformId)

    return this._http.post<SgpSummoner[]>(
      `/summoner-ledge/v1/regions/${platformId.toUpperCase()}/summoners/puuids`,
      [puuid],
      { baseURL: platformSgpServer.server }
    )
  }
}
