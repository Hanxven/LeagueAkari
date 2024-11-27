export interface MatchHistory {
  accountId: number
  games: Games
  platformId: string
}

export interface Games {
  gameBeginDate: string
  gameCount: number
  gameEndDate: string
  gameIndexBegin: number
  gameIndexEnd: number
  games: Game[]
}

export interface Game {
  endOfGameResult: string
  gameCreation: number
  gameCreationDate: string
  gameDuration: number
  gameId: number
  gameMode: string
  gameType: string
  gameVersion: string
  mapId: number
  participantIdentities: ParticipantIdentity[]
  participants: Participant[]
  platformId: string
  queueId: number
  seasonId: number
  teams: Team[]
}

export interface Team {
  bans: any[]
  baronKills: number
  dominionVictoryScore: number
  dragonKills: number
  firstBaron: boolean
  firstBlood: boolean
  firstDargon: boolean // LCU 接口中就是如此拼写，不知道是不是笔误
  firstInhibitor: boolean
  firstTower: boolean
  inhibitorKills: number
  riftHeraldKills: number
  teamId: number
  towerKills: number
  vilemawKills: number
  win: string | 'Win' | 'Fail'
}

export interface Participant {
  championId: number
  highestAchievedSeasonTier: string
  participantId: number
  spell1Id: number
  spell2Id: number
  stats: Stats & SgpFields
  teamId: number
  timeline: Timeline
}

export interface Timeline {
  creepsPerMinDeltas: CreepsPerMinDeltas
  csDiffPerMinDeltas: CsDiffPerMinDeltas
  damageTakenDiffPerMinDeltas: CsDiffPerMinDeltas
  damageTakenPerMinDeltas: CreepsPerMinDeltas
  goldPerMinDeltas: CreepsPerMinDeltas
  lane: string
  participantId: number
  role: string
  xpDiffPerMinDeltas: CsDiffPerMinDeltas
  xpPerMinDeltas: CreepsPerMinDeltas
}

export interface CsDiffPerMinDeltas {
  [key: string]: number
}

export interface CreepsPerMinDeltas {
  [key: string]: number
}

export interface Stats {
  assists: number
  causedEarlySurrender: boolean
  champLevel: number
  combatPlayerScore: number
  damageDealtToObjectives: number
  damageDealtToTurrets: number
  damageSelfMitigated: number
  deaths: number
  doubleKills: number
  earlySurrenderAccomplice: boolean
  firstBloodAssist: boolean
  firstBloodKill: boolean
  firstInhibitorAssist: boolean
  firstInhibitorKill: boolean
  firstTowerAssist: boolean
  firstTowerKill: boolean
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  goldEarned: number
  goldSpent: number
  inhibitorKills: number
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number
  playerAugment1: number
  playerAugment2: number
  playerAugment3: number
  playerAugment4: number
  playerAugment5: number
  playerAugment6: number
  killingSprees: number
  kills: number
  largestCriticalStrike: number
  largestKillingSpree: number
  largestMultiKill: number
  longestTimeSpentLiving: number
  magicDamageDealt: number
  magicDamageDealtToChampions: number
  magicalDamageTaken: number
  neutralMinionsKilled: number
  neutralMinionsKilledEnemyJungle: number
  neutralMinionsKilledTeamJungle: number
  objectivePlayerScore: number
  participantId: number
  pentaKills: number
  perk0: number
  perk0Var1: number
  perk0Var2: number
  perk0Var3: number
  perk1: number
  perk1Var1: number
  perk1Var2: number
  perk1Var3: number
  perk2: number
  perk2Var1: number
  perk2Var2: number
  perk2Var3: number
  perk3: number
  perk3Var1: number
  perk3Var2: number
  perk3Var3: number
  perk4: number
  perk4Var1: number
  perk4Var2: number
  perk4Var3: number
  perk5: number
  perk5Var1: number
  perk5Var2: number
  perk5Var3: number
  perkPrimaryStyle: number
  perkSubStyle: number
  physicalDamageDealt: number
  physicalDamageDealtToChampions: number
  physicalDamageTaken: number
  playerScore0: number
  playerScore1: number
  playerScore2: number
  playerScore3: number
  playerScore4: number
  playerScore5: number
  playerScore6: number
  playerScore7: number
  playerScore8: number
  playerScore9: number
  quadraKills: number
  sightWardsBoughtInGame: number
  subteamPlacement: number
  teamEarlySurrendered: boolean
  timeCCingOthers: number
  totalDamageDealt: number
  totalDamageDealtToChampions: number
  totalDamageTaken: number
  totalHeal: number
  totalMinionsKilled: number
  totalPlayerScore: number
  totalScoreRank: number
  totalTimeCrowdControlDealt: number
  totalUnitsHealed: number
  tripleKills: number
  trueDamageDealt: number
  trueDamageDealtToChampions: number
  trueDamageTaken: number
  turretKills: number
  unrealKills: number
  visionScore: number
  visionWardsBoughtInGame: number
  wardsKilled: number
  wardsPlaced: number
  win: boolean
  playerSubteamId: number
}

// 如果当前的战绩数据是从 SGP 转换得到的, 那么会有这些字段
interface SgpFields {
  individualPosition: string // "Invalid" or "TOP" or "JUNGLE" or "MIDDLE" or "BOTTOM" or "UTILITY"
  lane: string
  teamPosition: string
  pushPings: number
  visionClearedPings: number
  allInPings: number
  assistMePings: number
  basicPings: number
  commandPings: number
  dangerPings: number
  enemyMissingPings: number
  enemyVisionPings: number
  getBackPings: number
  holdPings: number
  needVisionPings: number
  onMyWayPings: number
}

export interface ParticipantIdentity {
  participantId: number
  player: Player
}

export interface Player {
  accountId: number
  currentAccountId: number
  currentPlatformId: string
  matchHistoryUri: string
  platformId: string
  profileIcon: number
  summonerId: number
  puuid: string
  gameName: string
  tagLine: string
  summonerName: string
}

// 为什么会有这么多的队列呢？
const pveQueues = new Set([
  // 人机模式和新手教程
  31, 32, 33, 34, 35, 36, 52, 800, 801, 810, 820, 830, 831, 832, 840, 841, 842, 850, 851, 852, 860,
  870, 880, 890, 2000, 2010, 2020,

  // 大提莫节，应该是新版的末日人机
  90, 91, 92, 950, 951, 960, 961,

  // 怪兽入侵模式，没打过不知道是不是
  981, 982, 990,

  // 奥德赛系列
  1030, 1031, 1032, 1040, 1041, 1050, 1051, 1060, 1061, 1070, 1071,

  // STRAWBERRY 模式
  1800, 1810, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890
])

export function isPveQueue(queueId: number) {
  if (typeof queueId === 'string') {
    return pveQueues.has(Number(queueId))
  }

  return pveQueues.has(queueId)
}

export interface GameTimeline {
  frames: GameTimelineFrame[]
}

interface GameTimelineFrame {
  events: Event[]
  participantFrames: Record<number, ParticipantFrame>
  timestamp: number
}

interface ParticipantFrame {
  currentGold: number
  dominionScore: number
  jungleMinionsKilled: number
  level: number
  minionsKilled: number
  participantId: number
  position: Position
  teamScore: number
  totalGold: number
  xp: number
}

interface Event {
  assistingParticipantIds: number[]
  buildingType: string
  itemId: number
  killerId: number
  laneType: string
  monsterSubType: string
  monsterType: string
  participantId: number
  position: Position
  skillSlot: number
  teamId: number
  timestamp: number
  towerType: string
  type: string
  victimId: number
}

interface Position {
  x: number
  y: number
}
