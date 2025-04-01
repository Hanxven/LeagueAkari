export interface PerkPage {
  autoModifiedSelections: any[]
  current: boolean
  id: number
  isActive: boolean
  isDeletable: boolean
  isEditable: boolean
  isRecommendationOverride: boolean
  isTemporary: boolean
  isValid: boolean
  lastModified: number
  name: string
  order: number
  pageKeystone: PageKeystone
  primaryStyleIconPath: string
  primaryStyleId: number
  primaryStyleName: string
  quickPlayChampionIds: any[]
  recommendationChampionId: number
  recommendationIndex: number
  runeRecommendationId: string
  secondaryStyleIconPath: string
  secondaryStyleName: string
  selectedPerkIds: number[]
  subStyleId: number
  tooltipBgPath: string
  uiPerks: PageKeystone[]
}

export interface PageKeystone {
  iconPath: string
  id: number
  name: string
  slotType: string
  styleId: number
}

export interface PerkInventory {
  canAddCustomPage: boolean
  customPageCount: number
  isCustomPageCreationUnlocked: boolean
  ownedPageCount: number
}

export interface RecommendPositions {
  [key: number]: {
    recommendedPositions: string[]
  }
}

export interface RecommendPage {
  isDefaultPosition: boolean
  isRecommendationOverride: boolean
  keystone: Keystone
  perks: Keystone[]
  position: string
  primaryPerkStyleId: number
  primaryRecommendationAttribute: string
  recommendationChampionId: number
  recommendationId: string
  secondaryPerkStyleId: number
  secondaryRecommendationAttribute: string
  summonerSpellIds: number[]
}

interface Keystone {
  iconPath: string
  id: number
  longDesc: string
  name: string
  recommendationDescriptor: string
  shortDesc: string
  slotType: string
  styleId: number
  styleIdName: string
  tooltip: string
}
