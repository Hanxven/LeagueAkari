export interface RewardsGrant {
  info: Info
  rewardGroup: RewardGroup
}

interface RewardGroup {
  active: boolean
  celebrationType: string
  childRewardGroupIds: any[]
  id: string
  localizations: Localizations2
  media: Localizations
  productId: string
  rewardStrategy: string
  rewards: Reward[]
  selectionStrategyConfig: SelectionStrategyConfig | null
  types: any[]
}

interface SelectionStrategyConfig {
  maxSelectionsAllowed: number
  minSelectionsAllowed: number
}

interface Reward {
  fulfillmentSource: string
  id: string
  itemId: string
  itemType: string
  localizations: Localizations3
  media: Media
  quantity: number
}

interface Media {
  iconUrl: string
}

interface Localizations3 {
  details: string
  title: string
}

interface Localizations2 {
  description?: string
  title?: string
}

interface Info {
  dateCreated: string
  grantElements: GrantElement[]
  granteeId: string
  grantorDescription: GrantorDescription
  id: string
  messageParameters: Localizations
  rewardGroupId: string
  selectedIds: any[]
  status: string
  viewed: boolean
}

interface GrantorDescription {
  appName: string
  entityId: string
}

interface GrantElement {
  elementId: string
  fulfillmentSource: string
  itemId: string
  itemType: string
  localizations: Localizations
  media: Localizations
  quantity: number
  status: string
}

interface Localizations {}

export interface RewardsGroup {
  active: boolean
  celebrationType: string
  childRewardGroupIds: any[]
  id: string
  localizations: Localizations
  media: Media
  productId: string
  rewardStrategy: string
  rewards: Reward2[]
  selectionStrategyConfig: SelectionStrategyConfig | null
  types: string[]
}

interface SelectionStrategyConfig {
  maxSelectionsAllowed: number
  minSelectionsAllowed: number
}

interface Reward2 {
  fulfillmentSource: string
  id: string
  itemId: string
  itemType: string
  localizations: Localizations2
  media: Media2
  quantity: number
}

interface Media2 {
  iconUrl?: string
  splashImage?: string
}

interface Localizations2 {
  details?: string
  title?: string
}

interface Media {
  canvasBackgroundImage?: string
  canvasDesign?: string
  canvasSize?: string
  introAnimation?: string
  introAnimationAudio?: string
  introLowSpecImage?: string
  loopAnimation?: string
  loopAnimationAudio?: string
  transitionAnimation?: string
  transitionAnimationAudio?: string
}

interface Localizations {
  description?: string
  title?: string
}
