export interface LobbyMember {
  allowedChangeActivity: boolean
  allowedInviteOthers: boolean
  allowedKickOthers: boolean
  allowedStartActivity: boolean
  allowedToggleInvite: boolean
  autoFillEligible: boolean
  autoFillProtectedForPromos: boolean
  autoFillProtectedForSoloing: boolean
  autoFillProtectedForStreaking: boolean
  botChampionId: number
  botDifficulty: string
  botId: string
  firstPositionPreference: string
  isBot: boolean
  isLeader: boolean
  isSpectator: boolean
  puuid: string
  ready: boolean
  secondPositionPreference: string
  showGhostedBanner: boolean
  summonerIconId: number
  summonerId: number
  summonerInternalName: string
  summonerLevel: number
  summonerName: string
  teamId: number
}

export interface Lobby {
  canStartActivity: boolean
  gameConfig: GameConfig
  invitations: Invitation[]
  localMember: LocalMember
  members: LocalMember[]
  mucJwtDto: MucJwtDto
  multiUserChatId: string
  multiUserChatPassword: string
  partyId: string
  partyType: string
  restrictions: any[]
  scarcePositions: any[]
  warnings: any[]
}

export interface MucJwtDto {
  channelClaim: string
  domain: string
  jwt: string
  targetRegion: string
}

export interface LocalMember {
  allowedChangeActivity: boolean
  allowedInviteOthers: boolean
  allowedKickOthers: boolean
  allowedStartActivity: boolean
  allowedToggleInvite: boolean
  autoFillEligible: boolean
  autoFillProtectedForPromos: boolean
  autoFillProtectedForSoloing: boolean
  autoFillProtectedForStreaking: boolean
  botChampionId: number
  botDifficulty: string
  botId: string
  firstPositionPreference: string
  // 竞技场，在小队中的位置，1 或 2
  intraSubteamPosition: number
  isBot: boolean
  isLeader: boolean
  isSpectator: boolean
  playerSlots: any[]
  puuid: string
  ready: boolean
  secondPositionPreference: string
  showGhostedBanner: boolean
  // 竞技场中，属于哪个小队，1 到 4
  subteamIndex: number
  summonerIconId: number
  summonerId: number
  summonerInternalName: string
  summonerLevel: number
  summonerName: string
  teamId: number
  tftNPEQueueBypass: boolean
}

export interface Invitation {
  invitationId: string
  invitationType: string
  state: string
  timestamp: string
  toSummonerId: number
  toSummonerName: string
}

export interface GameConfig {
  allowablePremadeSizes: number[]
  customLobbyName: string
  customMutatorName: string
  customRewardsDisabledReasons: any[]
  customSpectatorPolicy: string
  customSpectators: any[]
  customTeam100: any[]
  customTeam200: any[]
  gameMode: string
  isCustom: boolean
  isLobbyFull: boolean
  isTeamBuilderManaged: boolean
  mapId: number
  maxHumanPlayers: number
  maxLobbySize: number
  maxTeamSize: number
  pickType: string
  premadeSizeAllowed: boolean
  queueId: number
  shouldForceScarcePositionSelection: boolean
  showPositionSelector: boolean
  showQuickPlaySlotSelection: boolean
}

export interface CustomTeam100 {
  allowedChangeActivity: boolean
  allowedInviteOthers: boolean
  allowedKickOthers: boolean
  allowedStartActivity: boolean
  allowedToggleInvite: boolean
  autoFillEligible: boolean
  autoFillProtectedForPromos: boolean
  autoFillProtectedForSoloing: boolean
  autoFillProtectedForStreaking: boolean
  botChampionId: number
  botDifficulty: string
  botId: string
  firstPositionPreference: string
  isBot: boolean
  isLeader: boolean
  isSpectator: boolean
  puuid: string
  ready: boolean
  secondPositionPreference: string
  showGhostedBanner: boolean
  summonerIconId: number
  summonerId: number
  summonerInternalName: string
  summonerLevel: number
  summonerName: string
  teamId: number
}

export interface AvailableBot {
  active: boolean
  botDifficulties: string[]
  id: number
  name: string
}

export interface EogStatus {
  eogPlayers: string[]
  leftPlayers: string[]
  partySize: number
  readyPlayers: string[]
}

export interface QueueEligibility {
  eligible: boolean
  queueId: number
  restrictions: Restriction[]
}

interface Restriction {
  expiredTimestamp: number
  restrictionArgs: RestrictionArgs
  restrictionCode: string
  summonerIds: any[]
  summonerIdsString: string
}

interface RestrictionArgs {}

export interface ReceivedInvitation {
  canAcceptInvitation: boolean
  fromSummonerId: number
  fromSummonerName: string
  gameConfig: InvitationGameConfig
  invitationId: string
  invitationType: string
  restrictions: any[]
  state: string
  timestamp: string
}

interface InvitationGameConfig {
  gameMode: string
  inviteGameType: string
  mapId: number
  queueId: number
}
