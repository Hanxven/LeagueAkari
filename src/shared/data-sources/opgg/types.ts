export interface OpggNormalModeChampion {
  data: OpggNormalModeChampionData
  meta: {
    version: string
    cached_at: string
  }
}

interface OpggNormalModeChampionData {
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

export interface Versions {
  data: string[]
}

export interface OpggARAMBalance {
  data: OpggBalanceDataItem[]
}

interface OpggBalanceDataItem {
  champion_id: number
  attack_speed: number
  damage_dealt: number
  damage_taken: number
  cooldown_reduction: number
  healing: number
  tenacity: number
  shield_amount: number
  energy_regen: number
  area_of_effect_damage: number
  default: boolean
}

// {{baseUrl}}/api/global/champions/aram/101/none?tier=platinum_plus&version=14.10
// {{baseUrl}}/api/global/champions/aram/versions {"data":["14.10","14.09","14.08"]}

export interface OpggARAMDataItem {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: {
    win_rate: number
    pick_rate: number
    ban_rate: null
    tier: number
    kda: number
    rank: number
  }
  positions: null
  roles: any[]
}

export interface OpggARAMChampionSummary {
  data: OpggARAMDataItem[]
  meta: {
    version: string
    cached_at: string
    match_count: number
    analyzed_at: string
  }
}

export interface OpggArenaChampionSummary {
  data: OpggArenaDataItem[]
  meta: {
    version: string
    cached_at: string
  }
}

export interface OpggArenaDataItem {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: {
    win: number
    play: number
    total_place: number
    first_place: number
    pick_rate: number
    ban_rate: number
    kills: number
    assists: number
    deaths: number
    tier: number
    rank: number
  }
}

export type TierType =
  | 'all'
  | 'ibsg' // Iron, Bronze, Silver, Gold
  | 'gold_plus'
  | 'platinum_plus'
  | 'emerald_plus'
  | 'diamond_plus'
  | 'master'
  | 'master_plus'
  | 'grandmaster'
  | 'challenger'

export type RegionType =
  | 'global'
  | 'na'
  | 'euw'
  | 'kr'
  | 'br'
  | 'eune'
  | 'jp'
  | 'lan'
  | 'las'
  | 'oce'
  | 'tr'
  | 'ru'
  | 'sg'
  | 'id'
  | 'ph'
  | 'th'
  | 'vn'
  | 'tw'
  | 'me'

export type ModeType = 'aram' | 'arena' | 'nexus_blitz' | 'urf' | 'ranked'

export type PositionType = 'mid' | 'jungle' | 'adc' | 'top' | 'support' | 'all' | 'none'

export interface OpggRankedChampionsSummary {
  data: OpggRankedDataItem[]
  meta: {
    version: string
    cached_at: string
    match_count: number
    analyzed_at: string
  }
}

export interface OpggRankedDataItem {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: Averagestat | null
  positions: (
    | Position
    | Positions2
    | Positions3
    | Positions4
    | Positions5
    | Positions6
    | Positions7
  )[]
  roles: any[]
}

interface Positions7 {
  name: string
  stats: Stats
  roles: Role[]
  counters: any[]
}

interface Positions6 {
  name: string
  stats: Stats5
  roles: Role[]
  counters: any[]
}

interface Stats5 {
  win_rate: number
  pick_rate: number
  role_rate: number
  ban_rate: number
  kda: number
  tier_data: Tierdata4
}

interface Tierdata4 {
  tier: number
  rank: number
  rank_prev: number
  rank_prev_patch: null
}

interface Positions5 {
  name: string
  stats: Stats4
  roles: Role[]
  counters: any[]
}

interface Stats4 {
  win_rate: number
  pick_rate: number
  role_rate: number
  ban_rate: number
  kda: number
  tier_data: Tierdata3
}

interface Tierdata3 {
  tier: number
  rank: number
  rank_prev: null
  rank_prev_patch: number
}

interface Positions4 {
  name: string
  stats: Stats3
  roles: Role[]
  counters: any[]
}

interface Positions3 {
  name: string
  stats: Stats
  roles: Role[]
  counters: Counter[]
}

interface Positions2 {
  name: string
  stats: Stats3
  roles: Role[]
  counters: Counter[]
}

interface Stats3 {
  win_rate: number
  pick_rate: number
  role_rate: number
  ban_rate: number
  kda: number
  tier_data: Tierdata2
}

interface Tierdata2 {
  tier: number
  rank: number
  rank_prev: number
  rank_prev_patch: null | number
}

interface Position {
  name: string
  stats: Stats
  roles: Role[]
  counters: Counter[]
}

interface Counter {
  champion_id: number
  play: number
  win: number
}

interface Role {
  name: string
  stats: Stats2
}

interface Stats2 {
  win_rate: number
  role_rate: number
  play: number
  win: number
}

interface Stats {
  win_rate: number
  pick_rate: number
  role_rate: number
  ban_rate: number
  kda: number
  tier_data: Tierdata
}

interface Tierdata {
  tier: number
  rank: number
  rank_prev: number
  rank_prev_patch: number
}

interface Averagestat {
  win_rate: number
  pick_rate: number
  ban_rate: number
  kda: number
  tier: number
  rank: number
}

export interface OpggArenaModeChampion {
  data: OpggArenaChampionData
  meta: {
    version: string
    cached_at: string
  }
}

interface OpggArenaChampionData {
  summary: ArenaSummary
  core_items: Coreitem[]
  boots: Coreitem[]
  starter_items: Coreitem[]
  last_items: Coreitem[]
  prism_items: Coreitem[]
  skill_masteries: Skillmastery[]
  skills: Skill[]
  skill_evolves: any[]
  augment_group: Augmentgroup[]
  synergies: Synergy[]
}

interface Synergy {
  champion_id: number
  op_rank: number
  play: number
  win: number
  total_place: number
  first_place: number
  pick_rate: number
}

interface Augmentgroup {
  rarity: number
  augments: Augment[]
}

interface Augment {
  id: number
  win: number
  play: number
  total_place: number
  first_place: number
  pick_rate: number
}

interface Skill {
  order: string[]
  play: number
  win: number
  total_place: number
  first_place: number
  pick_rate: number
}

interface Skillmastery {
  ids: string[]
  play: number
  win: number
  total_place: number
  first_place: number
  pick_rate: number
  builds: Build[]
}

interface Build {
  order: string[]
  play: number
  win: number
  pick_rate: number
}

interface Coreitem {
  ids: number[]
  win: number
  play: number
  total_place: number
  first_place: number
  pick_rate: number
}

interface ArenaSummary {
  id: number
  is_rotation: boolean
  is_rip: boolean
  average_stats: AveragestatsArena
}

interface AveragestatsArena {
  win: number
  play: number
  total_place: number
  first_place: number
  pick_rate: number
  ban_rate: number
  kills: number
  assists: number
  deaths: number
  tier: number
  rank: number
}
