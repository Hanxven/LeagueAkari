export interface LobbyTeamBuilderChampSelectSession {
  actions: any[]
  allowBattleBoost: boolean
  allowDuplicatePicks: boolean
  allowLockedEvents: boolean
  allowRerolling: boolean
  allowSkinSelection: boolean
  benchChampions: BenchChampion[]
  benchEnabled: boolean
  boostableSkinCount: number
  chatDetails: ChatDetails
  counter: number
  entitledFeatureState: EntitledFeatureState
  gameId: number
  hasSimultaneousBans: boolean
  hasSimultaneousPicks: boolean
  isSpectating: boolean
  localPlayerCellId: number
  lockedEventIndex: number
  myTeam: MyTeam[]
  pickOrderSwaps: any[]
  recoveryCounter: number
  rerollsRemaining: number
  skipChampionSelect: boolean
  theirTeam: MyTeam[]
  timer: Timer
  trades: Trade[]
}

export interface Trade {
  cellId: number
  id: number
  state: string
}

export interface Timer {
  adjustedTimeLeftInPhase: number
  internalNowInEpochMs: number
  isInfinite: boolean
  phase: string
  totalTimeInPhase: number
}

export interface MyTeam {
  assignedPosition: string
  cellId: number
  championId: number
  championPickIntent: number
  entitledFeatureType: string
  nameVisibilityType: string
  obfuscatedPuuid: string
  obfuscatedSummonerId: number
  playerType: string
  puuid: string
  selectedSkinId: number
  spell1Id: number
  spell2Id: number
  summonerId: number
  team: number
  wardSkinId: number
}

export interface EntitledFeatureState {
  additionalRerolls: number
  unlockedSkinIds: any[]
}

export interface ChatDetails {
  chatRoomName: string
  chatRoomPassword?: any
  multiUserChatJWT: string
}

export interface BenchChampion {
  championId: number
  isPriority: boolean
}
