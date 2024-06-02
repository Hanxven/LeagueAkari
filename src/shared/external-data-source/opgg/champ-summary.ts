import axios from 'axios'

import { NormalizedExternalChampBuildDataSourceMeta } from '../normalized/champ-build'

interface OpggChampionResponse {
  data: OpggChampionData
  meta: OpggChampionMeta
}

interface OpggChampionMeta {
  version: string
  cached_at: string
}

interface OpggChampionData {
  summary: Summary
  summoner_spells: IdItems[]
  core_items: IdItems[]
  mythic_items: any[]
  boots: IdItems[]
  starter_items: IdItems[]
  last_items: IdItems[]
  rune_pages: RunePage[]
  runes: RuneBuild[]
  skill_masteries: SkillMastery[]
  skills: SkillBuild[]
  skill_evolves: any[]
  trends: Trends
  game_lengths: GameLength[]
  counters: any[]
}

interface GameLength {
  game_length: number
  rate: number
  average: number
  rank: number
}

interface Trends {
  total_rank: number
  total_position_rank: number
  win: Win[]
  pick: Win[]
  ban: Win[]
}

interface Win {
  version: string
  rate: number
  rank: number
  created_at: string
}

interface SkillMastery {
  ids: string[]
  play: number
  win: number
  pick_rate: number
  builds: SkillBuild[]
}

interface SkillBuild {
  order: string[]
  play: number
  win: number
  pick_rate: number
}

interface RunePage {
  id: number
  primary_page_id: number
  secondary_page_id: number
  play: number
  win: number
  pick_rate: number
  builds: RuneBuild[]
}

interface RuneBuild {
  id: number
  primary_page_id: number
  primary_rune_ids: number[]
  secondary_page_id: number
  secondary_rune_ids: number[]
  stat_mod_ids: number[]
  play: number
  win: number
  pick_rate: number
}

interface IdItems {
  ids: number[]
  win: number
  play: number
  pick_rate: number
}

interface Summary {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: AverageStats
  positions: null
  roles: any[]
}

interface AverageStats {
  win_rate: number
  pick_rate: number
  ban_rate: null
  kda: number
  tier: number
  rank: number
}

interface VersionsResponse {
  data: string[]
}

// {{baseUrl}}/api/global/champions/aram/101/none?tier=platinum_plus&version=14.10
// {{baseUrl}}/api/global/champions/aram/versions {"data":["14.10","14.09","14.08"]}

const OPGG_BASE_URL = 'https://lol-api-champion.op.gg'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'

export class OpggDataSource implements NormalizedExternalChampBuildDataSourceMeta {
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

  private _axiosInstance = axios.create({
    baseURL: OPGG_BASE_URL,
    headers: {
      'User-Agent': USER_AGENT
    }
  })

  async getChampionARAM(id: number, region = 'global', tier = 'platinum_plus', version?: string) {
    if (!version) {
      const versions = await this._axiosInstance.get<VersionsResponse>(
        `/api/${region}/champions/aram/versions`
      )

      if (versions.data.data.length) {
        version = versions.data.data[0]

        const result = await this._axiosInstance.get<OpggChampionResponse>(
          `/api/${region}/champions/aram/${id}/none`,
          {
            params: {
              tier,
              version
            }
          }
        )

        return result.data
      }
    }

    return null
  }
}
