export type GameflowPhase =
  | 'Matchmaking' // 正在匹配
  | 'ChampSelect' // 英雄选择中
  | 'ReadyCheck' // 等待接受状态中
  | 'InProgress' // 游戏进行中
  | 'EndOfGame' // 游戏结算
  | 'Lobby' // 房间
  | 'GameStart' //游戏开始
  | 'None' // 无
  | 'Reconnect' // 重新连接
  | 'WaitingForStats' // 等待结果
  | 'PreEndOfGame' // 结束游戏之前
  | 'WatchInProgress' // 在观战中
  | 'TerminatedInError' // 错误终止

export interface GameflowSession {
  gameClient: GameClient
  gameData: GameData
  gameDodge: GameDodge
  map: Map
  phase: GameflowPhase
}

export interface Map {
  assets: Assets
  categorizedContentBundles: CategorizedContentBundles
  description: string
  gameMode: string
  gameModeName: string
  gameModeShortName: string
  gameMutator: string
  id: number
  isRGM: boolean
  mapStringId: string
  name: string
  perPositionDisallowedSummonerSpells: CategorizedContentBundles
  perPositionRequiredSummonerSpells: CategorizedContentBundles
  platformId: string
  platformName: string
  properties: Properties
}

export interface Properties {
  suppressRunesMasteriesPerks: boolean
}

export interface CategorizedContentBundles {}

export interface Assets {
  'champ-select-background-sound': string
  'champ-select-flyout-background': string
  'champ-select-planning-intro': string
  'game-select-icon-active': string
  'game-select-icon-active-video': string
  'game-select-icon-default': string
  'game-select-icon-disabled': string
  'game-select-icon-hover': string
  'game-select-icon-intro-video': string
  'gameflow-background': string
  'gameflow-background-dark': string
  'gameselect-button-hover-sound': string
  'icon-defeat': string
  'icon-defeat-v2': string
  'icon-defeat-video': string
  'icon-empty': string
  'icon-hover': string
  'icon-leaver': string
  'icon-leaver-v2': string
  'icon-loss-forgiven-v2': string
  'icon-v2': string
  'icon-victory': string
  'icon-victory-video': string
  'map-north': string
  'map-south': string
  'music-inqueue-loop-sound': string
  'parties-background': string
  'postgame-ambience-loop-sound': string
  'ready-check-background': string
  'ready-check-background-sound': string
  'sfx-ambience-pregame-loop-sound': string
  'social-icon-leaver': string
  'social-icon-victory': string
}

export interface GameDodge {
  dodgeIds: any[]
  phase: string
  state: string
}

export interface GameData {
  gameId: number
  gameName: string
  isCustomGame: boolean
  password: string
  playerChampionSelections: PlayerChampionSelection[]
  queue: Queue
  spectatorsAllowed: boolean
  teamOne: TeamPlayer[]
  teamTwo: TeamPlayer[]
}

export interface PlayerChampionSelection {
  championId: number
  selectedSkinIndex: number
  spell1Id: number
  spell2Id: number
  summonerId: number // 旧 ID 系统中，无该字段
  puuid: string // 旧 ID 系统中，无该字段
  summonerInternalName: string
}

export interface TeamPlayer {
  championId: number
  accountId: number
  adjustmentFlags: number
  botDifficulty: string
  clientInSynch: boolean
  gameCustomization: GameCustomization
  index: number
  lastSelectedSkinIndex: number
  locale?: any
  minor: boolean
  originalAccountNumber: number
  originalPlatformId?: any
  partnerId: string
  pickMode: number
  pickTurn: number
  profileIconId: number
  puuid: string
  queueRating: number
  rankedTeamGuest: boolean
  selectedPosition: string
  selectedRole: string
  summonerId: number
  summonerInternalName: string
  summonerName: string
  teamOwner: boolean
  teamParticipantId: number
  teamRating: number
  timeAddedToQueue: number
  timeChampionSelectStart: number
  timeGameCreated: number
  timeMatchmakingStart: number
  voterRating: number
}

interface GameCustomization {
  Companions: string
  GoldenSpatulaClub: string
  Regalia: string
  challenges: string
  championOwned: string
  perks: string
  ranked: string
  statstones: string
  summonerEmotes: string
  summonerTrophy: string
  vintageSkin: string
}

export interface Queue {
  allowablePremadeSizes: any[]
  areFreeChampionsAllowed: boolean
  assetMutator: string
  category: string
  championsRequiredToPlay: number
  description: string
  detailedDescription: string
  gameMode: string
  gameTypeConfig: GameTypeConfig
  id: number
  isRanked: boolean
  isTeamBuilderManaged: boolean
  lastToggledOffTime: number
  lastToggledOnTime: number
  mapId: number
  maximumParticipantListSize: number
  minLevel: number
  minimumParticipantListSize: number
  name: string
  numPlayersPerTeam: number
  queueAvailability: string
  queueRewards: QueueRewards
  removalFromGameAllowed: boolean
  removalFromGameDelayMinutes: number
  shortName: string
  showPositionSelector: boolean
  spectatorEnabled: boolean
  type: string
}

export interface QueueRewards {
  isChampionPointsEnabled: boolean
  isIpEnabled: boolean
  isXpEnabled: boolean
  partySizeIpRewards: any[]
}

export interface GameTypeConfig {
  advancedLearningQuests: boolean
  allowTrades: boolean
  banMode: string
  banTimerDuration: number
  battleBoost: boolean
  crossTeamChampionPool: boolean
  deathMatch: boolean
  doNotRemove: boolean
  duplicatePick: boolean
  exclusivePick: boolean
  id: number
  learningQuests: boolean
  mainPickTimerDuration: number
  maxAllowableBans: number
  name: string
  onboardCoopBeginner: boolean
  pickMode:
    | 'SimulPickStrategy'
    | 'DraftModeSinglePickStrategy'
    | 'AllRandomPickStrategy'
    | 'TeamBuilderDraftPickStrategy'
    | string
  postPickTimerDuration: number
  reroll: boolean
  teamChampionPool: boolean
}

export interface GameClient {
  observerServerIp: string
  observerServerPort: number
  running: boolean
  serverIp: string
  serverPort: number
  visible: boolean
}
