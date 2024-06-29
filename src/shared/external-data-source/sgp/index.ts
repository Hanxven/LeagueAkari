import axios, { AxiosInstance } from 'axios'

interface RootObject {
  games: Game[]
}

interface Game {
  metadata: Metadata
  json: Json
}

interface Json {
  endOfGameResult: string
  gameCreation: number
  gameDuration: number
  gameEndTimestamp: number
  gameId: number
  gameMode: string
  gameName: string
  gameStartTimestamp: number
  gameType: string
  gameVersion: string
  mapId: number
  participants: Participant[]
  platformId: string
  queueId: number
  seasonId: number
  teams: Team[]
  tournamentCode: string
}

interface Team {
  bans: (Ban | Ban)[]
  objectives: Objectives
  teamId: number
  win: boolean
}

interface Objectives {
  baron: Baron
  champion: Baron
  dragon: Baron
  horde: Baron
  inhibitor: Baron
  riftHerald: Baron
  tower: Baron
}

interface Baron {
  first: boolean
  kills: number
}

interface Ban {
  championId: number
  pickTurn: number
}

interface Participant {
  allInPings: number
  assistMePings: number
  assists: number
  baronKills: number
  basicPings: number
  bountyLevel: number
  challenges: Challenges
  champExperience: number
  champLevel: number
  championId: number
  championName: string
  championTransform: number
  commandPings: number
  consumablesPurchased: number
  damageDealtToBuildings: number
  damageDealtToObjectives: number
  damageDealtToTurrets: number
  damageSelfMitigated: number
  dangerPings: number
  deaths: number
  detectorWardsPlaced: number
  doubleKills: number
  dragonKills: number
  eligibleForProgression: boolean
  enemyMissingPings: number
  enemyVisionPings: number
  firstBloodAssist: boolean
  firstBloodKill: boolean
  firstTowerAssist: boolean
  firstTowerKill: boolean
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  getBackPings: number
  goldEarned: number
  goldSpent: number
  holdPings: number
  individualPosition: string
  inhibitorKills: number
  inhibitorTakedowns: number
  inhibitorsLost: number
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number
  itemsPurchased: number
  killingSprees: number
  kills: number
  lane: string
  largestCriticalStrike: number
  largestKillingSpree: number
  largestMultiKill: number
  longestTimeSpentLiving: number
  magicDamageDealt: number
  magicDamageDealtToChampions: number
  magicDamageTaken: number
  missions: Missions
  needVisionPings: number
  neutralMinionsKilled: number
  nexusKills: number
  nexusLost: number
  nexusTakedowns: number
  objectivesStolen: number
  objectivesStolenAssists: number
  onMyWayPings: number
  participantId: number
  pentaKills: number
  perks: Perks
  physicalDamageDealt: number
  physicalDamageDealtToChampions: number
  physicalDamageTaken: number
  placement: number
  playerAugment1: number
  playerAugment2: number
  playerAugment3: number
  playerAugment4: number
  playerAugment5: number
  playerAugment6: number
  playerSubteamId: number
  profileIcon: number
  pushPings: number
  puuid: string
  quadraKills: number
  riotIdGameName: string
  riotIdTagline: string
  role: string
  sightWardsBoughtInGame: number
  spell1Casts: number
  spell1Id: number
  spell2Casts: number
  spell2Id: number
  spell3Casts: number
  spell4Casts: number
  subteamPlacement: number
  summoner1Casts: number
  summoner2Casts: number
  summonerId: number
  summonerLevel: number
  summonerName: string
  teamEarlySurrendered: boolean
  teamId: number
  teamPosition: string
  timeCCingOthers: number
  timePlayed: number
  totalAllyJungleMinionsKilled: number
  totalDamageDealt: number
  totalDamageDealtToChampions: number
  totalDamageShieldedOnTeammates: number
  totalDamageTaken: number
  totalEnemyJungleMinionsKilled: number
  totalHeal: number
  totalHealsOnTeammates: number
  totalMinionsKilled: number
  totalTimeCCDealt: number
  totalTimeSpentDead: number
  totalUnitsHealed: number
  tripleKills: number
  trueDamageDealt: number
  trueDamageDealtToChampions: number
  trueDamageTaken: number
  turretKills: number
  turretTakedowns: number
  turretsLost: number
  unrealKills: number
  visionClearedPings: number
  visionScore: number
  visionWardsBoughtInGame: number
  wardsKilled: number
  wardsPlaced: number
  win: boolean
}

interface Perks {
  statPerks: StatPerks
  styles: Style[]
}

interface Style {
  description: string
  selections: Selection[]
  style: number
}

interface Selection {
  perk: number
  var1: number
  var2: number
  var3: number
}

interface StatPerks {
  defense: number
  flex: number
  offense: number
}

interface Missions {
  Missions_ChampionsKilled: number
  Missions_CreepScore: number
  Missions_GoldFromStructuresDestroyed: number
  Missions_GoldFromTurretPlatesTaken: number
  Missions_HealingFromLevelObjects: number
  Missions_MinionsKilled: number
  Missions_TurretPlatesDestroyed: number
  PlayerScore0: number
  PlayerScore1: number
  PlayerScore10: number
  PlayerScore11: number
  PlayerScore2: number
  PlayerScore3: number
  PlayerScore4: number
  PlayerScore5: number
  PlayerScore6: number
  PlayerScore7: number
  PlayerScore8: number
  PlayerScore9: number
}

interface Challenges {
  '12AssistStreakCount': number
  InfernalScalePickup: number
  abilityUses: number
  acesBefore15Minutes: number
  alliedJungleMonsterKills: number
  baronTakedowns: number
  blastConeOppositeOpponentCount: number
  bountyGold: number
  buffsStolen: number
  completeSupportQuestInTime: number
  controlWardsPlaced: number
  damagePerMinute: number
  damageTakenOnTeamPercentage: number
  dancedWithRiftHerald: number
  deathsByEnemyChamps: number
  dodgeSkillShotsSmallWindow: number
  doubleAces: number
  dragonTakedowns: number
  earlyLaningPhaseGoldExpAdvantage?: number
  effectiveHealAndShielding: number
  elderDragonKillsWithOpposingSoul: number
  elderDragonMultikills: number
  enemyChampionImmobilizations: number
  enemyJungleMonsterKills: number
  epicMonsterKillsNearEnemyJungler: number
  epicMonsterKillsWithin30SecondsOfSpawn: number
  epicMonsterSteals: number
  epicMonsterStolenWithoutSmite: number
  firstTurretKilled: number
  fistBumpParticipation: number
  flawlessAces: number
  fullTeamTakedown: number
  gameLength: number
  getTakedownsInAllLanesEarlyJungleAsLaner?: number
  goldPerMinute: number
  hadOpenNexus: number
  immobilizeAndKillWithAlly: number
  initialBuffCount: number
  initialCrabCount: number
  jungleCsBefore10Minutes: number
  junglerTakedownsNearDamagedEpicMonster: number
  kTurretsDestroyedBeforePlatesFall: number
  kda: number
  killAfterHiddenWithAlly: number
  killParticipation: number
  killedChampTookFullTeamDamageSurvived: number
  killingSprees: number
  killsNearEnemyTurret: number
  killsOnOtherLanesEarlyJungleAsLaner?: number
  killsOnRecentlyHealedByAramPack: number
  killsUnderOwnTurret: number
  killsWithHelpFromEpicMonster: number
  knockEnemyIntoTeamAndKill: number
  landSkillShotsEarlyGame: number
  laneMinionsFirst10Minutes: number
  laningPhaseGoldExpAdvantage?: number
  legendaryCount: number
  legendaryItemUsed: (number | number)[]
  lostAnInhibitor: number
  maxCsAdvantageOnLaneOpponent?: number
  maxKillDeficit: number
  maxLevelLeadLaneOpponent?: number
  mejaisFullStackInTime: number
  moreEnemyJungleThanOpponent: number
  multiKillOneSpell: number
  multiTurretRiftHeraldCount: number
  multikills: number
  multikillsAfterAggressiveFlash: number
  outerTurretExecutesBefore10Minutes: number
  outnumberedKills: number
  outnumberedNexusKill: number
  perfectDragonSoulsTaken: number
  perfectGame: number
  pickKillWithAlly: number
  playedChampSelectPosition?: number
  poroExplosions: number
  quickCleanse: number
  quickFirstTurret: number
  quickSoloKills: number
  riftHeraldTakedowns: number
  saveAllyFromDeath: number
  scuttleCrabKills: number
  skillshotsDodged: number
  skillshotsHit: number
  snowballsHit: number
  soloBaronKills: number
  soloKills: number
  stealthWardsPlaced: number
  survivedSingleDigitHpCount: number
  survivedThreeImmobilizesInFight: number
  takedownOnFirstTurret: number
  takedowns: number
  takedownsAfterGainingLevelAdvantage: number
  takedownsBeforeJungleMinionSpawn: number
  takedownsFirstXMinutes: number
  takedownsInAlcove: number
  takedownsInEnemyFountain: number
  teamBaronKills: number
  teamDamagePercentage: number
  teamElderDragonKills: number
  teamRiftHeraldKills: number
  tookLargeDamageSurvived: number
  turretPlatesTaken: number
  turretTakedowns: number
  turretsTakenWithRiftHerald: number
  twentyMinionsIn3SecondsCount: number
  twoWardsOneSweeperCount: number
  unseenRecalls: number
  visionScoreAdvantageLaneOpponent?: number
  visionScorePerMinute: number
  voidMonsterKill: number
  wardTakedowns: number
  wardTakedownsBefore20M: number
  wardsGuarded: number
  junglerKillsEarlyJungle?: number
  killsOnLanersEarlyJungleAsJungler?: number
  soloTurretsLategame?: number
  controlWardTimeCoverageInRiverOrEnemyHalf?: number
  fasterSupportQuestCompletion?: number
  highestWardKills?: number
  firstTurretKilledTime?: number
  highestChampionDamage?: number
  shortestTimeToAceFromFirstTakedown?: number
  earliestDragonTakedown?: number
  highestCrowdControlScore?: number
  baronBuffGoldAdvantageOverThreshold?: number
  earliestBaron?: number
  earliestElderDragon?: number
  fastestLegendary?: number
  thirdInhibitorDestroyedTime?: number
  teleportTakedowns?: number
  hadAfkTeammate?: number
}

interface Metadata {
  product: string
  tags: string[]
  participants: string[]
  timestamp: string
  data_version: string
  info_type: string
  match_id: string
  private: boolean
}

export class SgpApi {
  private _http: AxiosInstance
  private _httpAgent: string

  constructor(appVersion: string) {
    // 是的，没错
    this._httpAgent = `LeagueAkari/${appVersion}`

    this._http = axios.create({
      headers: {
        'User-Agent': this._httpAgent
      }
    })
  }

  /**
   * 将 SGP 格式的比赛历史数据转换为 LCU 格式，用于在英雄联盟客户端中展示
   */
  private _parseMatchHistoryLolToLcu() {}
}
