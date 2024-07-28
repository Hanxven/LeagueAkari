import axios from 'axios'
import { AxiosRetry } from 'axios-retry'

import { NormalizedExternalChampBuildDataSourceMeta } from '../normalized/champ-build'
import {
  ArenaChampion,
  ModeType,
  OpggARAMBalance,
  OpggARAMChampionSummary,
  OpggARAMChampion as OpggNormalModeChampion,
  OpggRankedChampionsSummary,
  PositionType,
  RegionType,
  TierType,
  Versions
} from './types'

const axiosRetry = require('axios-retry').default as AxiosRetry

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
    baseURL: OpggDataSource.BASE_URL,
    headers: {
      'User-Agent': OpggDataSource.USER_AGENT
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
  }

  async getVersions(region: RegionType, mode: ModeType) {
    const versions = await this._http.get<Versions>(`/api/${region}/champions/${mode}/versions`)
    return versions.data
  }

  async getChampionsSummary(
    region: RegionType,
    mode: 'ranked',
    tier: TierType,
    version?: string
  ): Promise<OpggRankedChampionsSummary>
  async getChampionsSummary(
    region: RegionType,
    mode: 'aram',
    tier: TierType,
    version?: string
  ): Promise<OpggARAMChampionSummary>
  async getChampionsSummary(
    region: RegionType,
    mode: ModeType,
    tier: TierType,
    version?: string
  ): Promise<any> {
    if (!version) {
      const versions = await this.getVersions(region, mode)
      version = versions.data[0]
    }

    const result = await this._http.get<OpggARAMChampionSummary>(
      `/api/${region}/champions/${mode}`,
      {
        params: {
          tier,
          version
        }
      }
    )

    return result.data
  }

  /**
   * 斗魂竞技场模式，会返回特殊的结构
   */
  async getChampion(
    id: number,
    region: RegionType,
    mode: 'arena',
    tier: TierType
  ): Promise<ArenaChampion>

  /**
   * ARAM 模式，要求 position 为 none
   */
  async getChampion(
    id: number,
    region: RegionType,
    mode: 'aram',
    tier: TierType
  ): Promise<OpggNormalModeChampion>

  /**
   * 其他模式，如 URF, nexus_blitz 等
   */
  async getChampion(
    id: number,
    region: RegionType,
    mode: ModeType,
    tier: TierType,
    position: PositionType
  ): Promise<OpggNormalModeChampion>
  async getChampion(
    id: number,
    region: RegionType,
    mode: string,
    tier: TierType,
    position?: PositionType
  ): Promise<any> {
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
      params: { tier }
    })

    return data.data
  }

  async getARAMBalance() {
    return (await this._http.get<OpggARAMBalance>('/api/contents/aram-balance')).data
  }
}
