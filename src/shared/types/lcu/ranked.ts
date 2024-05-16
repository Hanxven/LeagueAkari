export interface RankedTiers {
  achievedTiers: AchievedTier[]
  summonerId: number
}

export interface AchievedTier {
  division: number
  queueType: string
  tier: string
}

export interface RankedStats {
  earnedRegaliaRewardIds: any[]
  highestCurrentSeasonReachedTierSR: string
  highestPreviousSeasonAchievedDivision: string
  highestPreviousSeasonAchievedTier: string
  highestPreviousSeasonEndDivision: string
  highestPreviousSeasonEndTier: string
  highestRankedEntry: RankedEntry
  highestRankedEntrySR: RankedEntry
  queueMap: QueueMap
  queues: RankedEntry[]
  rankedRegaliaLevel: number
  seasons: Seasons
  splitsProgress: Record<string, number>
}

export interface Seasons {
  CHERRY: CHERRY
  RANKED_FLEX_SR: CHERRY
  RANKED_SOLO_5x5: CHERRY
  RANKED_TFT: CHERRY
  RANKED_TFT_DOUBLE_UP: CHERRY
  RANKED_TFT_TURBO: CHERRY
}

export interface CHERRY {
  currentSeasonEnd: number
  currentSeasonId: number
  nextSeasonStart: number
}

interface QueueMap {
  CHERRY: RankedEntry
  RANKED_FLEX_SR: RankedEntry
  RANKED_SOLO_5x5: RankedEntry
  RANKED_TFT: RankedEntry
  RANKED_TFT_DOUBLE_UP: RankedEntry
  RANKED_TFT_TURBO: RankedEntry
}

export interface RankedEntry {
  division: string
  highestDivision: string
  highestTier: string
  isProvisional: boolean
  leaguePoints: number
  losses: number
  miniSeriesProgress: string
  previousSeasonAchievedDivision: string
  previousSeasonAchievedTier: string
  previousSeasonEndDivision: string
  previousSeasonEndTier: string
  provisionalGameThreshold: number
  provisionalGamesRemaining: number
  previousSeasonHighestTier: string
  previousSeasonHighestDivision: string
  queueType: string
  ratedRating: number
  ratedTier: string
  tier: string
  warnings?: any
  wins: number
}
