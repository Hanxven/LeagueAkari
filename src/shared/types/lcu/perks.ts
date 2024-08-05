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
