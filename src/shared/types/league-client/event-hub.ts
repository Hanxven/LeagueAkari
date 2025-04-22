export interface EventHubEvents {
  eventId: string
  eventInfo: EventInfo
}

export interface EventInfo {
  currentTokenBalance: number
  endDate: string
  eventIcon: string
  eventId: string
  eventName: string
  eventPassBundles: EventPassBundle[]
  eventTokenImage: string
  eventType: string
  isPassPurchased: boolean
  lockedTokenCount: number
  navBarIcon: string
  progressEndDate: string
  startDate: string
  timeOfLastUnclaimedReward: number
  tokenBundles: any[]
  unclaimedRewardCount: number
}

interface EventPassBundle {
  contentId: string
  itemId: number
  offerId: string
  typeId: string
}

export interface EventChapters {
  chapters: Chapter[]
  currentChapter: number
}

interface Chapter {
  backgroundImage: string
  backgroundVideo: string
  cardImage: string
  chapterEnd: number
  chapterNumber: number
  chapterStart: number
  foregroundImage: string
  levelFocus: number
  localizedDescription: string
  localizedTitle: string
  objectiveBannerImage: string
}

export interface EventDetailsData {
  eventIconPath: string
  eventName: string
  eventStartDate: string
  headerTitleImagePath: string
  helpModalImagePath: string
  inducteeName: string
  progressEndDate: string
  promotionBannerImage: string
  shopEndDate: string
}

export interface EventObjectivesBanner {
  currentChapter: CurrentChapter
  eventName: string
  trackProgress: TrackProgress
}

interface TrackProgress {
  currentLevel: number
  currentXP: number
  nextLevelXP: number
  nextReward: NextReward
}

interface NextReward {
  description: string
  level: string
  name: string
  state: string
  thumbIconPath: string
}

interface CurrentChapter {
  backgroundImage: string
  backgroundVideo: string
  cardImage: string
  chapterEnd: number
  chapterNumber: number
  chapterStart: number
  foregroundImage: string
  levelFocus: number
  localizedDescription: string
  localizedTitle: string
  objectiveBannerImage: string
}

export interface EventRewardTrackUnclaimedRewards {
  lockedTokensCount: number
  rewardsCount: number
  timeOfLastUnclaimedReward: number
}

export interface EventRewardTrackItem {
  progressRequired: number
  rewardOptions: RewardOption[]
  rewardTags: any[]
  state: string
  threshold: string
}

interface RewardOption {
  cardSize: string
  celebrationType: string
  headerType: string
  overrideFooter: string
  rewardDescription: string
  rewardGroupId: string
  rewardName: string
  selected: boolean
  splashImagePath: string
  state: string
  thumbIconPath: string
}

export interface EventRewardTrackBonusItem {
  progressRequired: number
  rewardOptions: RewardOption[]
  rewardTags: any[]
  state: string
  threshold: string
}

interface RewardOption {
  cardSize: string
  celebrationType: string
  headerType: string
  overrideFooter: string
  rewardDescription: string
  rewardGroupId: string
  rewardName: string
  selected: boolean
  splashImagePath: string
  state: string
  thumbIconPath: string
}

export interface EventPassBundle2 {
  bundledItems: BundledItem[]
  details: BundledItem
  discountPercentage: number
  finalPrice: number
  futureBalance: number
  initialPrice: number
  isPurchasable: boolean
}

interface BundledItem {
  decoratorBadgeURL: string
  description: string
  inventoryType: string
  itemId: number
  name: string
  owned: boolean
  quantity: number
  splashImage: string
  subInventoryType: string
}

export interface EventProgressInfoData {
  eventPassBundlesCatalogEntry: EventPassBundlesCatalogEntry[]
  passPurchased: boolean
  tokenImage: string
}

interface EventPassBundlesCatalogEntry {
  contentId: string
  itemId: number
  offerId: string
  typeId: string
}

export interface EventRewardTrackBonusProgress {
  currentLevelXP: number
  futureLevelProgress: number
  iteration: number
  level: number
  levelProgress: number
  passProgress: number
  totalLevelXP: number
  totalLevels: number
}

export interface EventProgressionPurchaseData {
  offerId: string
  pricePerLevel: number
  rpBalance: number
}

export interface EventRewardTrackXP {
  currentLevel: number
  currentLevelXP: number
  isBonusPhase: boolean
  iteration: number
  totalLevelXP: number
}

export interface EventNarrativeButtonData {
  activeEventId: string
  eventName: string
  iconPath: string
  showGlow: boolean
  showPip: boolean
}
