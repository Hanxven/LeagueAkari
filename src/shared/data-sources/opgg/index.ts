import axios from 'axios'
import { AxiosRetry } from 'axios-retry'
import axiosRetry from 'axios-retry'

import {
  ModeType,
  OpggARAMBalance,
  OpggARAMChampionSummary,
  OpggArenaChampionSummary,
  OpggArenaModeChampion,
  OpggNormalModeChampion,
  OpggRankedChampionsSummary,
  PositionType,
  RegionType,
  TierType,
  Versions
} from './types'

const isNodeEnvironment =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null

const _axiosRetry: AxiosRetry = isNodeEnvironment ? require('axios-retry').default : axiosRetry

export class OpggDataApi {
  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  static BASE_URL = 'https://lol-api-champion.op.gg'

  private _http = axios.create({
    baseURL: OpggDataApi.BASE_URL
    // headers: {
    //   'User-Agent': OpggDataSource.USER_AGENT
    // }
  })

  get http() {
    return this._http
  }

  constructor() {
    _axiosRetry(this._http, {
      retries: 2, // set it to 2 in order to fast fail
      retryDelay: () => 0,
      retryCondition: (error) => {
        return Boolean(error.response)
      }
    })
  }

  async getVersions(options: { region: RegionType; mode: ModeType; signal?: AbortSignal }) {
    let { mode, region } = options
    const versions = await this._http.get<Versions>(`/api/${region}/champions/${mode}/versions`, {
      signal: options.signal
    })
    return versions.data
  }

  async getChampionsTier(options: {
    region: RegionType
    mode: ModeType
    tier: TierType
    version?: string
    signal?: AbortSignal
  }): Promise<OpggRankedChampionsSummary | OpggArenaChampionSummary | OpggARAMChampionSummary> {
    let { region, mode, tier, version, signal: abortSignal } = options

    const result = await this._http.get(`/api/${region}/champions/${mode}`, {
      params: {
        tier,
        version
      },
      signal: abortSignal
    })

    return result.data
  }

  async getChampion(options: {
    id: number
    region: RegionType
    mode: ModeType
    tier: TierType
    position?: PositionType
    version?: string
    signal?: AbortSignal
  }): Promise<OpggNormalModeChampion | OpggArenaModeChampion | OpggArenaModeChampion> {
    let { id, region, mode, tier, position, version, signal: abortSignal } = options

    let url: string
    if (mode === 'arena') {
      url = `/api/${region}/champions/${mode}/${id}`
    } else {
      if (mode === 'aram') {
        position = 'none'
      }

      url = `/api/${region}/champions/${mode}/${id}/${position}`
    }

    const data = await this._http.get(url, {
      params: { tier, version },
      signal: abortSignal
    })

    return data.data
  }

  async getARAMBalance() {
    return (await this._http.get<OpggARAMBalance>('/api/contents/aram-balance')).data
  }
}
