import axios from 'axios'
import { AxiosRetry } from 'axios-retry'
import axiosRetry from 'axios-retry'

import { NormalizedExternalChampBuildDataSourceMeta } from '../normalized/champ-build'
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

export class OpggDataSource implements NormalizedExternalChampBuildDataSourceMeta {
  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  static BASE_URL = 'https://lol-api-champion.op.gg'

  private _name = 'OP.GG'

  private _version = 'v0.0.1'

  private _id = 'opgg'

  private _updateAt = new Date(1990, 0, 1)

  get updateAt() {
    return this._updateAt
  }

  get version() {
    return this._version
  }

  get name() {
    return this._name
  }

  get id() {
    return this._id
  }

  private _http = axios.create({
    baseURL: OpggDataSource.BASE_URL
    // headers: {
    //   'User-Agent': OpggDataSource.USER_AGENT
    // }
  })

  constructor() {
    _axiosRetry(this._http, {
      retries: 3,
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

  async getChampionsSummary(options: {
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
