export interface ChampSelectSession extends ChampSelectSessionBase {
  allowDuplicatePicks: boolean
  allowLockedEvents: boolean
  benchChampions: BenchChampion[]
  benchEnabled: boolean
  boostableSkinCount: number
  counter: number
  entitledFeatureState: EntitledFeatureState
  gameId: number
  lockedEventIndex: number
  pickOrderSwaps: any[]
  recoveryCounter: number
  skipChampionSelect: boolean
}

export interface ChampSelectSessionBase {
  actions: Action[][]
  allowBattleBoost: boolean
  allowRerolling: boolean
  allowSkinSelection: boolean
  bans: Bans
  chatDetails: ChatDetails
  hasSimultaneousBans: boolean
  hasSimultaneousPicks: boolean
  isCustomGame: boolean
  isSpectating: boolean
  localPlayerCellId: number
  myTeam: ChampSelectTeam[]
  rerollsRemaining: number
  theirTeam: ChampSelectTeam[]
  timer: Timer
  trades: {
    cellId: number
    id: number
    state: 'INVALID' | 'AVAILABLE'
  }[]
}

export interface ChampSelectSummoner {
  actingBackgroundAnimationState: string
  activeActionType: string
  areSummonerActionsComplete: boolean
  assignedPosition: string
  banIntentSquarePortratPath: string
  cellId: number
  championIconStyle: string
  championId: number
  championName: string
  currentChampionVotePercentInteger: number
  isActingNow: boolean
  isDonePicking: boolean
  isOnPlayersTeam: boolean
  isPickIntenting: boolean
  isPlaceholder: boolean
  isSelf: boolean
  nameVisibilityType: string
  obfuscatedPuuid: string
  obfuscatedSummonerId: number
  pickSnipedClass: string
  puuid: string
  shouldShowActingBar: boolean
  shouldShowBanIntentIcon: boolean
  shouldShowExpanded: boolean
  shouldShowRingAnimations: boolean
  shouldShowSelectedSkin: boolean
  shouldShowSpells: boolean
  showMuted: boolean
  showSwaps: boolean
  showTrades: boolean
  skinId: number
  skinSplashPath: string
  slotId: number
  spell1IconPath: string
  spell2IconPath: string
  statusMessageKey: string
  summonerId: number
  swapId: number
  tradeId: number
}

/**
 * 判断是否是极地大乱斗的 session，如果为 undefined 则为 false
 * @param obj session 对象
 * @returns 是否是
 */
export function isBenchEnabledSession(obj: any): obj is ChampSelectSession {
  return obj && typeof obj.benchEnabled !== 'undefined' && obj.benchEnabled
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

export interface ChampSelectTeam {
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

export interface BenchChampion {
  championId: number
  isPriority: boolean
}

export interface Bans {
  myTeamBans: number[]
  numBans: number
  theirTeamBans: number[]
}

export interface GridChamp {
  disabled: boolean
  freeToPlay: boolean
  freeToPlayForQueue: boolean
  id: number
  loyaltyReward: boolean
  masteryChestGranted: boolean
  masteryLevel: number
  masteryPoints: number
  name: string
  owned: boolean
  positionsFavorited: any[]
  rented: boolean
  roles: any[]
  selectionStatus: SelectionStatus
  squarePortraitPath: string
  xboxGPReward: boolean
}

export interface SelectionStatus {
  banIntented: boolean
  banIntentedByMe: boolean
  isBanned: boolean
  pickIntented: boolean
  pickIntentedByMe: boolean
  pickIntentedPosition: string
  pickedByOtherOrBanned: boolean
  selectedByMe: boolean
}

export interface Timer {
  adjustedTimeLeftInPhase: number
  internalNowInEpochMs: number
  isInfinite: boolean
  phase: string
  totalTimeInPhase: number
}

export interface ChampSelectTeam {
  assignedPosition: string
  cellId: number
  championId: number
  championPickIntent: number
  playerType: string
  selectedSkinId: number
  spell1Id: number
  spell2Id: number
  summonerId: number
  team: number
  wardSkinId: number
}

export interface ChatDetails {
  chatRoomName: string
  chatRoomPassword: string
  multiUserChatJWT: string
}

export interface Action {
  actorCellId: number
  championId: number
  completed: boolean
  id: number
  isAllyAction: boolean
  isInProgress: boolean
  pickTurn: number
  type: string
}

export interface OngoingTrade {
  id: number
  initiatedByLocalPlayer: boolean
  otherSummonerIndex: number
  requesterChampionName: string
  requesterChampionSplashPath: string
  responderChampionName: string
  responderIndex: number
  state: string | 'RECEIVED' | 'SENT' | 'ACCEPTED' | 'DECLINED'
}

export interface CarouselSkins {
  championId: number
  childSkins: ChildSkin[]
  chromaPreviewPath: null | string
  disabled: boolean
  emblems: Emblem[]
  groupSplash: string
  id: number
  isBase: boolean
  isChampionUnlocked: boolean
  name: string
  ownership: Ownership
  productType: null
  rarityGemPath: string
  skinAugments: SkinAugments
  splashPath: string
  splashVideoPath: null
  stillObtainable: boolean
  tilePath: string
  unlocked: boolean
}

interface Emblem {
  emblemPath: EmblemPath
  name: string
  positions: Positions
}

interface Positions {
  horizontal: string
  vertical: string
}

interface EmblemPath {
  large: string
  small: string
}

export interface ChildSkin {
  championId: number
  chromaPreviewPath: string
  colors: string[]
  disabled: boolean
  id: number
  isBase: boolean
  isChampionUnlocked: boolean
  name: string
  ownership: Ownership
  parentSkinId: number
  shortName: string
  skinAugments: SkinAugments
  splashPath: string
  splashVideoPath: null
  stage: number
  stillObtainable: boolean
  tilePath: string
  unlocked: boolean
}

interface SkinAugments {}

interface Ownership {
  loyaltyReward: boolean
  owned: boolean
  rental: Rental
  xboxGPReward: boolean
}

interface Rental {
  rented: boolean
}

export interface MySelection {
  assignedPosition: string
  cellId: number
  championId: number
  championPickIntent: number
  nameVisibilityType: string
  obfuscatedPuuid: string
  obfuscatedSummonerId: number
  puuid: string
  selectedSkinId: number
  spell1Id: number
  spell2Id: number
  summonerId: number
  team: number
  wardSkinId: number
}
