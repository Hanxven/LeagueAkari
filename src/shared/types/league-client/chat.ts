export interface ChatMessage {
  body: string
  fromId: string
  fromObfuscatedSummonerId: number
  fromPid: string
  fromSummonerId: number
  id: string
  isHistorical: boolean
  timestamp: string
  type: string // information | chat | groupchat | celebration | system
}

export interface ChatPerson {
  availability: string
  gameName: string
  gameTag: string
  icon: number
  id: string
  lastSeenOnlineTimestamp?: any
  lol: LOL
  name: string
  obfuscatedSummonerId: number
  patchline: string
  pid: string
  platformId: string
  product: string
  productName: string
  puuid: string
  statusMessage: string
  summary: string
  summonerId: number
  time: number
}

export interface LOL {
  bannerIdSelected: string
  challengeCrystalLevel: string
  challengeTitleSelected: string
  challengeTokensSelected: string
  championId: string
  companionId: string
  damageSkinId: string
  gameId: string
  gameMode: string
  gameQueueType: string
  gameStatus: string
  iconOverride: string
  initRankStat: string
  initSummoner: string
  isObservable: string
  mapId: string
  mapSkinId: string
  pty: string
  queueId: string
  regalia: string
  skinVariant: string
  skinname: string
  timeStamp: string
}

export interface Conversation {
  gameName: string
  gameTag: string
  id: string
  inviterId: string
  isMuted: boolean
  lastMessage?: any
  multiUserChatJWT: string
  name: string
  password: string
  pid: string
  targetRegion: string
  type: string
  unreadMessageCount: number
}

export interface ChatState {
  statusMessage: string
  availability: string
  gameName: string
  gameTag: string
  icon: number
  id: string
  lastSeenOnlineTimestamp?: any
  lol: ChatLol
  name: string
  obfuscatedSummonerId: number
  patchline: string
  pid: string
  platformId: string
  product: string
  productName: string
  puuid: string
  summary: string
  summonerId: number
  time: number
}

export interface ChatLol {
  bannerIdSelected: string
  challengeCrystalLevel: string
  challengeTitleSelected: string
  challengeTokensSelected: string
  championId: string
  companionId: string
  damageSkinId: string
  gameId: string
  gameMode: string
  gameQueueType: string
  gameStatus: string
  iconOverride: string
  initRankStat: string
  initSummoner: string
  isObservable: string
  mapId: string
  mapSkinId: string
  pty: string
  queueId: string
  regalia: string
  skinVariant: string
  skinname: string
  timeStamp: string
}

export interface Friend {
  availability: string
  displayGroupId: number
  displayGroupName: string
  gameName: string
  gameTag: string
  groupId: number
  groupName: string
  icon: number
  id: string
  isP2PConversationMuted: boolean
  lastSeenOnlineTimestamp?: any
  lol: Lol
  name: string
  note: string
  patchline: string
  pid: string
  platformId: string
  product: string
  productName: string
  puuid: string
  statusMessage: string
  summary: string
  summonerId: number
  time: number
}

interface Lol {
  bannerIdSelected: string
  challengeCrystalLevel: string
  challengePoints: string
  challengeTokensSelected: string
  championId: string
  companionId: string
  damageSkinId: string
  gameId: string
  gameMode: string
  gameQueueType: string
  gameStatus: string
  iconOverride: string
  initSummoner: string
  isObservable: string
  mapId: string
  mapSkinId: string
  profileIcon: string
  queueId: string
  regalia: string
  skinVariant: string
  skinname: string
  timeStamp: string
}

export interface FriendGroup {
  collapsed: boolean
  id: number
  isLocalized: boolean
  isMetaGroup: boolean
  name: string
  priority: number
}
