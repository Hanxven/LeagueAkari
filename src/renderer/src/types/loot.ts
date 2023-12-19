export interface LootMap {
  [key: string]: Loot
}

export interface Loot {
  asset: string
  count: number
  disenchantLootName: string
  disenchantRecipeName: string
  disenchantValue: number
  displayCategories: string
  expiryTime: number
  isNew: boolean
  isRental: boolean
  itemDesc: string
  itemStatus: string
  localizedDescription: string
  localizedName: string
  localizedRecipeSubtitle: string
  localizedRecipeTitle: string
  lootId: string
  lootName: string
  parentItemStatus: string
  parentStoreItemId: number
  rarity: string
  redeemableStatus: string
  refId: string
  rentalGames: number
  rentalSeconds: number
  shadowPath: string
  splashPath: string
  storeItemId: number
  tags: string
  tilePath: string
  type: string
  upgradeEssenceName: string
  upgradeEssenceValue: number
  upgradeLootName: string
  value: number
}

export interface LootCraftResponse {
  added: Added[]
  redeemed: any[]
  removed: Added[]
}

export interface Added {
  deltaCount: number
  playerLoot: PlayerLoot
}

export interface PlayerLoot {
  asset: string
  count: number
  disenchantLootName: string
  disenchantRecipeName: string
  disenchantValue: number
  displayCategories: string
  expiryTime: number
  isNew: boolean
  isRental: boolean
  itemDesc: string
  itemStatus: string
  localizedDescription: string
  localizedName: string
  localizedRecipeSubtitle: string
  localizedRecipeTitle: string
  lootId: string
  lootName: string
  parentItemStatus: string
  parentStoreItemId: number
  rarity: string
  redeemableStatus: string
  refId: string
  rentalGames: number
  rentalSeconds: number
  shadowPath: string
  splashPath: string
  storeItemId: number
  tags: string
  tilePath: string
  type: string
  upgradeEssenceName: string
  upgradeEssenceValue: number
  upgradeLootName: string
  value: number
}
