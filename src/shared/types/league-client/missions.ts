export interface Mission {
  backgroundImageUrl: string
  celebrationType: string
  clientNotifyLevel: string
  completedDate: number
  completionExpression: string
  cooldownTimeMillis: number
  description: string
  display: Display
  displayType: string
  earnedDate: number
  endTime: number
  expiringWarnings: ExpiringWarning[]
  helperText: string
  iconImageUrl: string
  id: string
  internalName: string
  isNew: boolean
  lastUpdatedTimestamp: number
  locale: string
  media: Media
  metadata: Metadata
  missionType: string
  objectives: Objective[]
  requirements: string[]
  rewardStrategy: RewardStrategy
  rewards: Reward[]
  sequence: number
  seriesName: string
  startTime: number
  status: string
  title: string
  viewed: boolean
}

export interface Reward {
  description: string
  iconNeedsFrame: boolean
  iconUrl: string
  isObjectiveBasedReward: boolean
  itemId: string
  media: Media2
  quantity: number
  rewardFulfilled: boolean
  rewardGroup: string
  rewardGroupSelected: boolean
  rewardType: string
  sequence: number
  smallIconUrl: string
  uniqueName: string
}

interface Media2 {
  icon?: string
}

interface RewardStrategy {
  groupStrategy: string
  selectMaxGroupCount: number
  selectMinGroupCount: number
}

interface Objective {
  description: string
  hasObjectiveBasedReward: boolean
  progress: Progress
  requirements: any[]
  rewardGroups: any[]
  sequence: number
  status: string
  type: string
}

interface Progress {
  currentProgress: number
  lastViewedProgress: number
  totalCount: number
}

interface Metadata {
  chain: number
  chainSize: number
  missionType: string
  npeRewardPack: NpeRewardPack
  order: number
  tutorial: Tutorial
  weekNum: number
  xpReward: number
}

interface Tutorial {
  displayRewards: DisplayRewards
  queueId: string
  stepNumber: number
  useChosenChampion: boolean
  useQuickSearchMatchmaking: boolean
}

interface DisplayRewards {
  '1'?: string
  '3'?: string
}

interface NpeRewardPack {
  index: number
  majorReward: MajorReward
  minorRewards: (MinorReward | MinorRewards2 | MinorRewards3 | MinorRewards4)[]
  premiumReward: boolean
  rewardKey: string
}

interface MinorRewards4 {
  data: Data10
  renderer: string
}

interface Data10 {
  hideInCalendarDetail?: boolean
  quantity?: number
}

interface MinorRewards3 {
  data: Data9
  renderer: string
}

interface Data9 {
  type?: string
  quantity?: number
}

interface MinorRewards2 {
  data: Data
  renderer: string
}

interface Data {
  gameModes?: string[]
  quantity?: number
}

interface MinorReward {
  data: Data4
  renderer: string
}

interface MajorReward {
  data: Datum | Data2 | Data3 | Data4 | Data5 | Data6 | Data7 | Data8 | null
  renderer: string
}

interface Data8 {
  gameModes: string[]
  hasCustomDetailImage: boolean
}

interface Data7 {
  champIds: number[]
  type: string
}

interface Data6 {
  ids: number[]
}

interface Data5 {
  gameModes: string[]
}

interface Data4 {
  quantity: number
}

interface Data3 {
  type: string
}

interface Data2 {
  hideInCalendarDetail: boolean
  ids: number[]
}

interface Datum {
  id: number
}

interface Media {
  mission_icon?: string
}

interface ExpiringWarning {
  alertTime: number
  message: string
  type: string
}

interface Display {
  attributes: string[]
  locations: string[]
}

export interface MissionData {
  level: number
  loyaltyEnabled: boolean
  playerInventory: PlayerInventory
  userInfoToken: null
}

interface PlayerInventory {
  champions: any[]
  icons: any[]
  inventoryJwts: string[]
  skins: any[]
  wardSkins: any[]
}

export interface MissionSeries {
  createdDate: number
  description: string
  displayType: string
  eligibilityType: string
  endDate: number
  id: string
  internalName: string
  lastUpdatedTimestamp: number
  media: Media
  optInButtonText: string
  optOutButtonText: string
  parentInternalName: string
  startDate: number
  status: string
  tags: string[]
  title: string
  type: string
  viewed: boolean
  warnings: any[]
}

interface Media {
  accentColor: string
  backgroundImageLargeUrl: string
  backgroundImageSmallUrl: string
  backgroundUrl: string
  trackerIcon: string
  trackerIconUrl: string
}
