export interface SgpMatchHistoryLol {
  games: SgpGameSummaryLol[]
}

export interface SgpGameSummaryLol {
  metadata: SgpGameMetadataLol
  json: SgpGameSummaryJsonLol
}

export interface SgpGameSummaryJsonLol {
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
  participants: SgpParticipantLol[]
  platformId: string
  queueId: number
  seasonId: number
  teams: Team[]
  tournamentCode: string
}

export interface Team {
  bans: Ban[]
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

export interface SgpParticipantLol {
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
  missions: SgpMissions
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
  statPerks: SgpStatPerks
  styles: Style[]
}

interface Style {
  description: string
  selections: SgpSelection[]
  style: number
}

export interface SgpSelection {
  perk: number
  var1: number
  var2: number
  var3: number
}

export interface SgpStatPerks {
  defense: number
  flex: number
  offense: number
}

export interface SgpMissions {
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

export interface SgpGameMetadataLol {
  product: string
  tags: string[]
  participants: string[]
  timestamp: string
  data_version: string
  info_type: string
  match_id: string
  private: boolean
}

export interface SgpMatchHistoryTft {
  games: SgpGameTft[]
}

export interface SgpGameTft {
  metadata: SgpGameMetadataLol
  json: SgpGameTftJson
}

export interface SgpGameTftJson {
  endOfGameResult: string
  gameCreation: number
  gameId: number
  game_datetime: string
  game_id: number
  game_length: number
  game_version: string
  mapId: number
  participants: SgpParticipantTft[]
  queueId: number
  queue_id: number
  tft_game_type: string
  tft_set_core_name: string
  tft_set_number: number
}

interface SgpParticipantTft {
  augments: string[]
  companion: Companion
  gold_left: number
  last_round: number
  level: number
  missions: SgpMissionsTft
  placement: number
  players_eliminated: number
  puuid: string
  time_eliminated: number
  total_damage_to_players: number
  traits: Trait[]
  units: Unit[]
}

interface Unit {
  character_id: string
  itemNames: string[]
  name: string
  rarity: number
  tier: number
}

interface Trait {
  name: string
  num_units: number
  style: number
  tier_current: number
  tier_total: number
}

interface SgpMissionsTft {
  Assists: number
  DamageDealt: number
  DamageDealtToObjectives: number
  DamageDealtToTurrets: number
  DamageTaken: number
  Deaths: number
  DoubleKills: number
  GoldEarned: number
  GoldSpent: number
  InhibitorsDestroyed: number
  KillingSprees: number
  Kills: number
  LargestKillingSpree: number
  LargestMultiKill: number
  MagicDamageDealt: number
  MagicDamageDealtToChampions: number
  MagicDamageTaken: number
  NeutralMinionsKilledTeamJungle: number
  PentaKills: number
  PhysicalDamageDealt: number
  PhysicalDamageDealtToChampions: number
  PhysicalDamageTaken: number
  PlayerScore0: number
  PlayerScore1: number
  PlayerScore10: number
  PlayerScore11: number
  PlayerScore2: number
  PlayerScore3: number
  PlayerScore4: number
  PlayerScore5: number
  PlayerScore6: number
  PlayerScore9: number
  QuadraKills: number
  Spell1Casts: number
  Spell2Casts: number
  Spell3Casts: number
  Spell4Casts: number
  SummonerSpell1Casts: number
  TimeCCOthers: number
  TotalDamageDealtToChampions: number
  TotalMinionsKilled: number
  TripleKills: number
  TrueDamageDealt: number
  TrueDamageDealtToChampions: number
  TrueDamageTaken: number
  UnrealKills: number
  VisionScore: number
  WardsKilled: number
}

interface Companion {
  content_ID: string
  item_ID: number
  skin_ID: number
  species: string
}

export interface SgpGameDetailsLol {
  metadata: SgpGameMetadataLol
  json: SgpGameJsonDetailsLol
}

interface SgpGameJsonDetailsLol {
  endOfGameResult: string
  frameInterval: number
  frames: Frame[]
  gameId: number
  participants: Participant[]
}

interface Participant {
  participantId: number
  puuid: string
}

interface Frame {
  events: Event[]
  participantFrames: ParticipantFrames
  timestamp: number
}

interface ParticipantFrames {
  [key: string]: ParticipantFrame
}

interface ParticipantFrame {
  championStats: ChampionStats
  currentGold: number
  damageStats: DamageStats
  goldPerSecond: number
  jungleMinionsKilled: number
  level: number
  minionsKilled: number
  participantId: number
  position: Position
  timeEnemySpentControlled: number
  totalGold: number
  xp: number
}

interface DamageStats {
  magicDamageDone: number
  magicDamageDoneToChampions: number
  magicDamageTaken: number
  physicalDamageDone: number
  physicalDamageDoneToChampions: number
  physicalDamageTaken: number
  totalDamageDone: number
  totalDamageDoneToChampions: number
  totalDamageTaken: number
  trueDamageDone: number
  trueDamageDoneToChampions: number
  trueDamageTaken: number
}

interface ChampionStats {
  abilityHaste: number
  abilityPower: number
  armor: number
  armorPen: number
  armorPenPercent: number
  attackDamage: number
  attackSpeed: number
  bonusArmorPenPercent: number
  bonusMagicPenPercent: number
  ccReduction: number
  cooldownReduction: number
  health: number
  healthMax: number
  healthRegen: number
  lifesteal: number
  magicPen: number
  magicPenPercent: number
  magicResist: number
  movementSpeed: number
  omnivamp: number
  physicalVamp: number
  power: number
  powerMax: number
  powerRegen: number
  spellVamp: number
}

interface Event {
  realTimestamp?: number
  timestamp: number
  type: string
  levelUpType?: string
  participantId?: number
  skillSlot?: number
  itemId?: number
  creatorId?: number
  wardType?: string
  level?: number
  bounty?: number
  killStreakLength?: number
  killerId?: number
  position?: Position
  shutdownBounty?: number
  victimDamageReceived?: VictimDamageReceived[]
  victimId?: number
  killType?: string
  afterId?: number
  beforeId?: number
  goldGain?: number
  laneType?: string
  teamId?: number
  victimDamageDealt?: VictimDamageReceived[]
  assistingParticipantIds?: number[]
  killerTeamId?: number
  monsterType?: string
  monsterSubType?: string
  multiKillLength?: number
  buildingType?: string
  towerType?: string
  gameId?: number
  winningTeam?: number
}

interface VictimDamageReceived {
  basic: boolean
  magicDamage: number
  name: string
  participantId: number
  physicalDamage: number
  spellName: string
  spellSlot: number
  trueDamage: number
  type: string
}

interface Position {
  x: number
  y: number
}

export interface SgpRankedStats {
  queues: Queue[]
  highestPreviousSeasonEndTier: string
  highestPreviousSeasonEndRank: string
  highestPreviousSeasonAchievedTier: string
  highestPreviousSeasonAchievedRank: string
  earnedRegaliaRewardIds: any[]
  currentSeasonSplitPoints: number
  previousSeasonSplitPoints: number
  seasons: Seasons
}

interface Seasons {
  RANKED_TFT: RANKEDTFT
  RANKED_TFT_TURBO: RANKEDTFT
  CHERRY: RANKEDTFT
  RANKED_FLEX_SR: RANKEDTFT
  RANKED_TFT_DOUBLE_UP: RANKEDTFT
  RANKED_SOLO_5x5: RANKEDTFT
}

interface RANKEDTFT {
  currentSeasonId: number
  currentSeasonEnd: number
  nextSeasonStart: number
}

interface Queue {
  queueType: string
  provisionalGameThreshold: number
  tier?: string
  rank?: string
  leaguePoints: number
  cumulativeLp: number
  wins: number
  losses: number
  provisionalGamesRemaining: number
  highestTier?: string
  highestRank?: string
  previousSeasonEndTier?: string
  previousSeasonEndRank?: string
  previousSeasonHighestTier?: string
  previousSeasonHighestRank?: string
  previousSeasonAchievedTier?: string
  previousSeasonAchievedRank?: string
  ratedRating: number
  premadeMmrRestricted: boolean
  ratedTier?: string
}

export interface SgpSummoner {
  id: number
  puuid: string
  accountId: number
  name: string
  internalName: string
  profileIconId: number
  level: number
  expPoints: number
  levelAndXpVersion: number
  revisionId: number
  revisionDate: number
  lastGameDate: number
  nameChangeFlag: boolean
  unnamed: boolean
  privacy: string
  expToNextLevel: number
}

export interface SpectatorData {
  reconnectDelay: number
  gameName: string
  game: SpectatorGameflowSession
  playerCredentials: SpectatorPlayerCredentials
}

interface SpectatorPlayerCredentials {
  gameId: number
  queueId: number
  playerId: number
  puuid: string
  serverPort: number
  championId: number
  lastSelectedSkinIndex: number
  summonerId: number
  observer: boolean
  gameVersion: string
  gameMode: string
  observerEncryptionKey: string
  observerServerIp: string
  observerServerPort: number
  queueType: string
  gameCreateDate: number
}

interface SpectatorGameflowSession {
  id: number
  gameState: string
  queueTypeName: string
  name: string
  pickTurn: number
  mapId: number
  gameMode: string
  maxNumPlayers: number
  gameType: string
  gameQueueConfigId: number
  spectatorDelay: number
  gameVersion: string
  teamOne: SpectatorGameflowSessionTeam[]
  teamTwo: SpectatorGameflowSessionTeam[]
  playerChampionSelections: SpectatorGameflowSessionPlayerChampionSelection[]
  bannedChampions: any[]
  observers: any[]
}

interface SpectatorGameflowSessionPlayerChampionSelection {
  summonerInternalName: string
  championId: number
  selectedSkinIndex: number
  spell1Id: number
  spell2Id: number
}

interface SpectatorGameflowSessionTeam {
  puuid: string
  summonerId: number
  lastSelectedSkinIndex: number
  teamOwner: boolean
  profileIconId: number
  teamParticipantId: number
  championId: number
  selectedRole: string
  selectedPosition: string
  summonerName: string
  summonerInternalName: string
}
