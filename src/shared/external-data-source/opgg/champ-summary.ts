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
  summoner_spells: SummonerSpell[]
  core_items: SummonerSpell[]
  mythic_items: any[]
  boots: SummonerSpell[]
  starter_items: SummonerSpell[]
  last_items: SummonerSpell[]
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

interface SummonerSpell {
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
