import axios from 'axios'

import { SgpGameDetailsLol, SgpGameSummaryLol, SgpMatchHistoryLol } from './types'

export interface AvailableServersMap {
  [region: string]: {
    name: string
    server: string
  }
}

export class SgpApi {
  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'

  private _availableSgpServers: AvailableServersMap = {}

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
    return this._availableSgpServers[platformId.toUpperCase()] !== undefined
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

  getMatchHistory(sgpServerId: string, playerPuuid: string, start: number, count: number) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._availableSgpServers[sgpServerId.toUpperCase()]
    if (!platformSgpServer) {
      throw new Error(`unknown sgpServerId: ${sgpServerId}`)
    }

    return this._http.get<SgpMatchHistoryLol>(
      `/match-history-query/v1/products/lol/player/${playerPuuid}/SUMMARY?startIndex=${start}&count=${count}`,
      { baseURL: platformSgpServer.server }
    )
  }

  getGameSummary(platformId: string, gameId: number) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._availableSgpServers[platformId.toUpperCase()]
    if (!platformSgpServer) {
      throw new Error(`unknown platformId: ${platformId}`)
    }

    return this._http.get<SgpGameSummaryLol>(
      `/match-history-query/v1/products/lol/${platformId.toUpperCase()}_${gameId}/SUMMARY`,
      { baseURL: platformSgpServer.server }
    )
  }

  getGameDetails(platformId: string, gameId: number) {
    if (!this._jwtToken) {
      throw new Error('jwt token is not set')
    }

    const platformSgpServer = this._availableSgpServers[platformId.toUpperCase()]
    if (!platformSgpServer) {
      throw new Error(`unknown platformId: ${platformId}`)
    }

    return this._http.get<SgpGameDetailsLol>(
      `/match-history-query/v1/products/lol/${platformId.toUpperCase()}_${gameId}/DETAILS`,
      { baseURL: platformSgpServer.server }
    )
  }

  /**
   * 将 SGP 格式的比赛历史数据转换为 LCU 格式，用于在英雄联盟客户端中展示
   */
  // private _parseMatchHistoryLolToLcu(sgpFormatted: SgpMatchHistoryLol) {
  //   if (sgpFormatted.games.length === 0) {
  //     return null
  //   }

  //   const first = sgpFormatted.games[0]

  //   const outer = {
  //     accountId: 0,
  //     platformId: 0
  //   }

  //   const games = sgpFormatted.games.map((game) => {
  //     const json = game.json

  //     const lcuTeams = game.json.teams.map((team) => {
  //       const lcuTeam = {
  //         ...team,
  //         bans: team.bans,
  //         baronKills: team.objectives.baron.kills,
  //         dominionVictoryScore: 0,
  //         dragonKills: team.objectives.dragon,
  //         firstBaron: team.objectives.baron.first,
  //         firstBlood: team.objectives.,
  //         teamId: team.teamId,
  //         win: team.win
  //       }
  //     })

  //     const lcuGame = {
  //       ...json,
  //       gameCreation: json.gameCreation,
  //       gameCreateDate: '',
  //       gameDuration: json.gameDuration,
  //       gameId: json.gameId,
  //       gameMode: json.gameMode,
  //       gameType: json.gameType,
  //       gameVersion: json.gameVersion,
  //       mapId: json.mapId,
  //       participantIdentities: [],
  //       participants: [],
  //       platformId: json.platformId,
  //       queueId: json.queueId,
  //       seasonId: json.seasonId
  //     }
  //   })

  //   const gamesMeta = {
  //     gameBeginDate: first.json.gameStartTimestamp,
  //     gameEndDate: first.json.gameEndTimestamp,
  //     gameCount: sgpFormatted.games.length,
  //     gameIndexBegin: 0, // just put it here for now
  //     gameIndexEnd: 0,
  //     games: []
  //   }

  //   return outer
  // }
}
