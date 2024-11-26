import {
  Augment,
  ChampionSimple,
  Item,
  Perk,
  Perkstyles,
  Queue,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { Game } from '@shared/types/league-client/match-history'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { ParsedRole } from '@shared/utils/ranked'

import { EncounteredGame } from '../storage/entities/EncounteredGame'
import { SavedPlayer } from '../storage/entities/SavedPlayers'

interface GameDataEnv {
  summonerSpells: Record<number | string, SummonerSpell>
  items: Record<number | string, Item>
  queues: Record<number | string, Queue>
  perks: Record<number | string, Perk>
  perkstyles: Record<number | string, Perkstyles['styles'][number]>
  augments: Record<number | string, Augment>
  champions: Record<number | string, ChampionSimple>
}

interface TeamsEnv {
  [key: string]: string[]
}

interface MatchHistoryEnv {
  [key: string]: {
    source: 'lcu' | 'sgp'
    tag?: string
    targetCount: number
    data: Game[] // lcu game object
  }
}

interface RankedStatsEnv {
  [key: string]: {
    source: 'lcu' | 'sgp'
    data: RankedStats
  }
}

interface SummonerEnv {
  [key: string]: {
    source: 'lcu' | 'sgp'
    data: SummonerInfo
  }
}

interface NotUnavailableEnv {
  phase: 'champ-select' | 'in-game'
  gameInfo: {
    queueId: number
    queueType: string
    gameId: number
    gameMode: string
  }
}

interface UnavailableEnv {
  phase: 'unavailable'
  gameInfo: null
}

type QueryStageEnv = NotUnavailableEnv | UnavailableEnv

interface ChampionMasteryEnv {
  [key: string]: {
    source: 'lcu' | 'sgp'
    data: Record<
      number,
      {
        championId: number
        championLevel: number
        championPoints: number
      }
    >
  }
}

interface SavedInfoEnv {
  [key: string]: SavedPlayer & { encounteredGames: EncounteredGame[] }
}

interface ChampionSelectionsEnv {
  [key: string]: number
}

interface PositionAssignmentsEnv {
  [key: string]: {
    position: string
    role: ParsedRole | null
  }
}

interface PlayerStatsEnv {
  players: Record<string, MatchHistoryGamesAnalysisAll>
  teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
}

interface PremadeTeamsEnv {
  [key: string]: string[][]
}

export type TemplateEnv = {
  /**
   * Version of League Akari
   */
  akariVersion: string

  /**
   * '/all' or something else
   */
  prefix?: string

  /**
   * Whom will be sent stats to
   */
  target: 'ally' | 'enemy' | 'all'

  /**
   * currently only zh-CN or en
   */
  locale: string

  utils: {
    isBotQueue: (queueId: number) => boolean
    isPveQueue: (queueId: number) => boolean
  }
  /**
   * Region, for eg. TENCENT, SG2
   */
  region: string

  /**
   * Available only in TENCENT region
   */
  rsoPlatformId: string

  /**
   * Self Puuid
   */
  selfPuuid: string

  /**
   * Self Team Id, if not in any team, it will be null.
   */
  selfTeamId: string | null

  /**
   * League Client Game Data Assets, not a completed list.
   * includes:
   * - summonerSpells
   * - items
   * - queues
   * - perks
   * - perkstyles
   * - augments
   * - champions, (summary)
   */
  gameData: GameDataEnv

  /**
   * Ally members. If not in a team, it will be empty.
   */
  allyMembers: string[]

  /**
   * Enemy members.
   */
  enemyMembers: string[]

  /**
   * All members.
   */
  allMembers: string[]

  /**
   * Target members.
   */
  targetMembers: string[]

  /**
   * Teams environment including team data for each player.
   */
  teams: TeamsEnv

  /**
   * Match history environment including match history data for each player.
   */
  matchHistory: MatchHistoryEnv

  /**
   * Ranked stats environment including ranked stats data for each player.
   */
  rankedStats: RankedStatsEnv

  /**
   * Summoner environment including summoner data for each player.
   */
  summoner: SummonerEnv

  /**
   * Query stage environment including game information and phase.
   */
  queryStage: QueryStageEnv

  /**
   * Champion mastery environment including champion mastery data for each player.
   * Note: Simplified version
   */
  championMastery: ChampionMasteryEnv

  /**
   * Saved player information including encountered games.
   */
  savedInfo: SavedInfoEnv

  /**
   * Champion selections environment including champion selections for each player.
   */
  championSelections: ChampionSelectionsEnv

  /**
   * Position assignments environment including position and role assignments for each player.
   */
  positionAssignments: PositionAssignmentsEnv

  /**
   * Player stats environment including player and team stats.
   * If there's no player stats, it will be null.
   */
  playerStats: PlayerStatsEnv | null

  /**
   * Premade teams
   */
  premadeTeams: PremadeTeamsEnv
}
