export interface SummonerSpell {
  id: number
  name: string
  description: string
  summonerLevel: number
  cooldown: number
  gameModes: string[]
  iconPath: string
}

export interface Perkstyles {
  schemaVersion: number
  styles: Style[]
}

export interface Style {
  id: number
  name: string
  tooltip: string
  iconPath: string
  assetMap: AssetMap
  isAdvanced: boolean
  allowedSubStyles: number[]
  subStyleBonus: SubStyleBonus[]
  slots: Slot[]
  defaultPageName: string
  defaultSubStyle: number
  defaultPerks: number[]
  defaultPerksWhenSplashed: number[]
  defaultStatModsPerSubStyle: DefaultStatModsPerSubStyle[]
}

export interface DefaultStatModsPerSubStyle {
  id: string
  perks: number[]
}

export interface Slot {
  type: string
  slotLabel: string
  perks: number[]
}

export interface SubStyleBonus {
  styleId: number
  perkId: number
}

export interface AssetMap {
  p8400_s0_k0?: string
  p8400_s0_k8437?: string
  p8400_s0_k8439?: string
  p8400_s0_k8465?: string
  p8400_s8000_k0?: string
  p8400_s8000_k8437?: string
  p8400_s8000_k8439?: string
  p8400_s8000_k8465?: string
  p8400_s8100_k0?: string
  p8400_s8100_k8437?: string
  p8400_s8100_k8439?: string
  p8400_s8100_k8465?: string
  p8400_s8200_k0?: string
  p8400_s8200_k8437?: string
  p8400_s8200_k8439?: string
  p8400_s8200_k8465?: string
  p8400_s8300_k0?: string
  p8400_s8300_k8437?: string
  p8400_s8300_k8439?: string
  p8400_s8300_k8465?: string
  svg_icon: string
  svg_icon_16: string
  p8100_s0_k0?: string
  p8100_s0_k8112?: string
  p8100_s0_k8124?: string
  p8100_s0_k8128?: string
  p8100_s0_k9923?: string
  p8100_s8000_k0?: string
  p8100_s8000_k8112?: string
  p8100_s8000_k8124?: string
  p8100_s8000_k8128?: string
  p8100_s8000_k9923?: string
  p8100_s8200_k0?: string
  p8100_s8200_k8112?: string
  p8100_s8200_k8124?: string
  p8100_s8200_k8128?: string
  p8100_s8200_k9923?: string
  p8100_s8300_k0?: string
  p8100_s8300_k8112?: string
  p8100_s8300_k8124?: string
  p8100_s8300_k8128?: string
  p8100_s8300_k9923?: string
  p8100_s8400_k0?: string
  p8100_s8400_k8112?: string
  p8100_s8400_k8124?: string
  p8100_s8400_k8128?: string
  p8100_s8400_k9923?: string
  p8000_s0_k0?: string
  p8000_s0_k8005?: string
  p8000_s0_k8008?: string
  p8000_s0_k8010?: string
  p8000_s0_k8021?: string
  p8000_s8100_k0?: string
  p8000_s8100_k8005?: string
  p8000_s8100_k8008?: string
  p8000_s8100_k8010?: string
  p8000_s8100_k8021?: string
  p8000_s8200_k0?: string
  p8000_s8200_k8005?: string
  p8000_s8200_k8008?: string
  p8000_s8200_k8010?: string
  p8000_s8200_k8021?: string
  p8000_s8300_k0?: string
  p8000_s8300_k8005?: string
  p8000_s8300_k8008?: string
  p8000_s8300_k8010?: string
  p8000_s8300_k8021?: string
  p8000_s8400_k0?: string
  p8000_s8400_k8005?: string
  p8000_s8400_k8008?: string
  p8000_s8400_k8010?: string
  p8000_s8400_k8021?: string
  p8200_s0_k0?: string
  p8200_s0_k8214?: string
  p8200_s0_k8229?: string
  p8200_s0_k8230?: string
  p8200_s8000_k0?: string
  p8200_s8000_k8214?: string
  p8200_s8000_k8229?: string
  p8200_s8000_k8230?: string
  p8200_s8100_k0?: string
  p8200_s8100_k8214?: string
  p8200_s8100_k8229?: string
  p8200_s8100_k8230?: string
  p8200_s8300_k0?: string
  p8200_s8300_k8214?: string
  p8200_s8300_k8229?: string
  p8200_s8300_k8230?: string
  p8200_s8400_k0?: string
  p8200_s8400_k8214?: string
  p8200_s8400_k8229?: string
  p8200_s8400_k8230?: string
  p8300_s0_k0?: string
  p8300_s0_k8351?: string
  p8300_s0_k8360?: string
  p8300_s0_k8369?: string
  p8300_s8000_k0?: string
  p8300_s8000_k8351?: string
  p8300_s8000_k8360?: string
  p8300_s8000_k8369?: string
  p8300_s8100_k0?: string
  p8300_s8100_k8351?: string
  p8300_s8100_k8360?: string
  p8300_s8100_k8369?: string
  p8300_s8200_k0?: string
  p8300_s8200_k8351?: string
  p8300_s8200_k8360?: string
  p8300_s8200_k8369?: string
  p8300_s8400_k0?: string
  p8300_s8400_k8351?: string
  p8300_s8400_k8360?: string
  p8300_s8400_k8369?: string
}

export interface Item {
  id: number
  name: string
  description: string
  active: boolean
  inStore: boolean
  from: number[]
  to: number[]
  categories: string[]
  maxStacks: number
  requiredChampion: string
  requiredAlly: string
  requiredBuffCurrencyName: string
  requiredBuffCurrencyCost: number
  specialRecipe: number
  isEnchantment: boolean
  price: number
  priceTotal: number
  iconPath: string
}

export interface ChampionSimple {
  id: number
  name: string
  alias: string
  squarePortraitPath: string
  roles: string[]
}

// for reference
export type GameMode =
  | 'NEXUSBLITZ' // 极限闪击
  | 'URF' // 无限火力 / 无限乱斗
  | 'PRACTICETOOL' // 训练模式
  | 'SNOWURF' // 冰雪无限火力
  | 'TUTORIAL' // 新手教程
  | 'CLASSIC' // 经典
  | 'ARAM' // 极地大乱斗
  | 'DOOMBOTSTEEMO' // 末日人机 - 提莫
  | 'ULTBOOK' // 终极魔典
  | 'ONEFORALL' // 克隆大作战
  | 'ARSR' // ?
  | 'ASSASSINATE' // 血月杀
  | 'FIRSTBLOOD' // 超载
  | 'PROJECT' // ?
  | 'STARGUARDIAN' // 星之守护者
  | 'BRAWL' // 神木之门
  | 'CHERRY' // 斗魂竞技场 (Arena)
  | 'STRAWBERRY' // 无尽狂潮 (Swarm)

export interface GameMap {
  id: number
  name: string
  description: string
  mapStringId: string
}

export interface GameMapAsset {
  [key: string]: GameMapAssetDetails[]
}

/** 类型没有那么完善 */
export interface GameMapAssetDetails {
  isDefault: boolean
  description: string
  mapStringId: string
  gameMode: string
  gameModeName: string
  gameModeShortName: string
  gameModeDescription: string
  name: string
  gameMutator: string
  isRGM: boolean
  properties: any
  perPositionRequiredSummonerSpells: any
  perPositionDisallowedSummonerSpells: any
  assets: Record<string, string>
  locStrings: any
  categorizedContentBundles: any
  tutorialCards: any[]
}

export interface Perk {
  id: number
  name: string
  majorChangePatchVersion: string
  tooltip: string
  shortDesc: string
  longDesc: string
  recommendationDescriptor: string
  iconPath: string
  endOfGameStatDescs: string[]
  recommendationDescriptorAttributes: RecommendationDescriptorAttributes
}

interface RecommendationDescriptorAttributes {
  kUtility?: number
  kBurstDamage?: number
  kDamagePerSecond?: number
  kGold?: number
  kMoveSpeed?: number
  kHealing?: number
  kDurability?: number
  kCooldown?: number
  kMana?: number
}

export interface SimpleQueueMap {
  [key: string]: Queue
}

export interface ChampDetails {
  id: number
  name: string
  alias: string
  title: string
  shortBio: string
  tacticalInfo: ChampTacticalInfo
  playstyleInfo: ChampPlaystyleInfo
  squarePortraitPath: string
  stingerSfxPath: string
  chooseVoPath: string
  banVoPath: string
  roles: string[]
  recommendedItemDefaults: any[]
  skins: ChampSkin[]
  passive: ChampPassive
  spells: ChampSpell[]
}

export interface ChampSpell {
  spellKey: string
  name: string
  abilityIconPath: string
  abilityVideoPath: string
  abilityVideoImagePath: string
  cost: string
  cooldown: string
  description: string
  dynamicDescription: string
  range: number[]
  costCoefficients: number[]
  cooldownCoefficients: number[]
  coefficients: ChampCoefficients
  effectAmounts: ChampEffectAmounts
  ammo: ChampAmmo
  maxLevel: number
}

export interface ChampAmmo {
  ammoRechargeTime: number[]
  maxAmmo: number[]
}

export interface ChampEffectAmounts {
  [key: string]: number[]
}

export interface ChampCoefficients {
  coefficient1: number
  coefficient2: number
}

export interface ChampPassive {
  name: string
  abilityIconPath: string
  abilityVideoPath: string
  abilityVideoImagePath: string
  description: string
}

export interface ChampSkin {
  id: number
  isBase: boolean
  name: string
  splashPath: string
  uncenteredSplashPath: string
  tilePath: string
  loadScreenPath: string
  skinType: string
  rarity: string
  isLegacy: boolean
  splashVideoPath?: any
  collectionSplashVideoPath?: any
  featuresText?: any
  chromaPath?: string
  emblems?: ChampEmblem[]
  regionRarityId: number
  rarityGemPath?: string
  skinLines?: ChampSkinLine[]
  description?: string
  loadScreenVintagePath?: string
  chromas?: ChampChroma[]
  questSkinInfo?: QuestSkinInfo
  skinAugments?: SkinAugments
}

export interface QuestSkinInfo {
  name: string
  productType: string
  collectionDescription: string
  descriptionInfo: any[]
  splashPath: string
  uncenteredSplashPath: string
  tilePath: string
  collectionCardPath: string
  tiers: Tier[]
}

export interface Tier {
  id: number
  name: string
  stage: number
  description: string
  splashPath: string
  uncenteredSplashPath: string
  tilePath: string
  loadScreenPath: string
  shortName: string
  splashVideoPath: null | string
  collectionSplashVideoPath: null | string
  collectionCardHoverVideoPath: null | string
  skinAugments: SkinAugments
}

interface Overlay {
  centeredLCOverlayPath: string
  uncenteredLCOverlayPath: string
  socialCardLCOverlayPath: string
  tileLCOverlayPath: string
}

interface Borders {
  layer0: Layer0[]
  layer1?: Layer0[]
}

interface Layer0 {
  contentId: string
  layer: number
  priority: number
  borderPath: string
}
export interface SkinAugments {
  borders: Borders
  augments?: Augment2[]
}

export interface Augment2 {
  contentId: string
  overlays: Overlay[]
}

interface Overlay {
  centeredLCOverlayPath: string
  uncenteredLCOverlayPath: string
  socialCardLCOverlayPath: string
  tileLCOverlayPath: string
}

interface Borders {
  layer0: Layer0[]
  layer1?: Layer0[]
}

interface Layer0 {
  contentId: string
  layer: number
  priority: number
  borderPath: string
}

export interface ChampChroma {
  id: number
  name: string
  chromaPath: string
  colors: string[]
  descriptions: ChampDescription[]
  rarities: (ChampRarity | ChampRarity)[]
}

export interface ChampRarity {
  region: string
  rarity: number
}

export interface ChampDescription {
  region: string
  description: string
}

export interface ChampSkinLine {
  id: number
}

export interface ChampEmblem {
  name: string
  emblemPath: ChampEmblemPath
  positions: ChampPositions
}

export interface ChampPositions {}

export interface ChampEmblemPath {
  large: string
  small: string
}

export interface ChampPlaystyleInfo {
  damage: number
  durability: number
  crowdControl: number
  mobility: number
  utility: number
}

export interface ChampTacticalInfo {
  style: number
  difficulty: number
  damageType: string
}

export const enum QueueEnum {
  BOT_INTRO = 830, // 新手（我怎么感觉和 Beginner 反了）
  BOT_INTERMEDIATE = 840, // 中等
  BOT_BEGINNER = 850, // 普通
  ARAM = 450, // 极地大乱斗
  CUSTOM = 0, // 自定义
  RANK_SOLO = 420, // 单排
  RANK_FLEX = 440, // 灵活
  ARURF = 900 // 无限火力
}

/**
 * 是否是人机模式
 * @param queueId 队列 ID
 */
export function isBotQueue(queueId: number) {
  return (
    queueId === QueueEnum.BOT_BEGINNER ||
    queueId === QueueEnum.BOT_INTERMEDIATE ||
    queueId === QueueEnum.BOT_INTRO
  )
}

export interface QueueLegacy {
  name: string
  shortName: string
  description: string
  detailedDescription: string
}

export interface Queue {
  id: number
  name: string
  shortName: string
  description: string
  detailedDescription: string
  gameSelectModeGroup: string
  gameSelectCategory: string
  gameSelectPriority: number
}

export const enum PickMode {
  ALL_RANDOM_PICK_STRATEGY = 'AllRandomPickStrategy',
  SIMUL_PICK_STRATEGY = 'SimulPickStrategy'
}

export interface Augment {
  id: number
  nameTRA: string
  augmentSmallIconPath: string
  rarity: string
}

export interface StrawberryHub {
  AllowedChampions: StAllowedChampions
  MapDisplayInfoList: MapDisplayInfoList[]
  ProgressGroups: ProgressGroup[]
  PowerUpGroups: PowerUpGroup[]
  EoGNarrativeBarks: EoGNarrativeBark[]
}

interface EoGNarrativeBark {
  id: string
  o: number
  value: EoGNarrativeBarkValue
}

interface EoGNarrativeBarkValue {
  RewardGroup: RewardGroup
  Title: string
  SubHeader: string
  Content: string
  DetailTextLine1: string
  DetailTextLine2: string
  DetailTextLine3: string
  Image: string
  IconImage: string
  IsPrimordian: boolean
}

interface RewardGroup {
  Id: string
  Name: string
  Description: string
  RewardStrategy: string
  SelectionStrategyConfig: SelectionStrategyConfig2
  Rewards: RewardGroupReward[]
}

interface RewardGroupReward {
  Title: string
  Details: string
  Media: Media | Media | null
  ItemId: string
  ItemType?: string
}

interface PowerUpGroup {
  id: string
  o: number
  value: PowerUpGroupValue
}

interface PowerUpGroupValue {
  Name: string
  Description: string
  IconImage: string
  Boons: Boon[]
  PrerequisiteBoon: PrerequisiteBoon | null
}

interface Boon {
  id: string
  o: number
  value: PrerequisiteBoon
}

interface ProgressGroup {
  id: string
  o: number
  value: ProgressGroupValue
}

interface ProgressGroupValue {
  Name: string
  IconImage: string
  Milestones: Milestone[]
  PrerequisiteBoon: PrerequisiteBoon | null
}

interface PrerequisiteBoon {
  ContentId: string
  OfferId: string
  ItemId: number
  OfferPrice: number
  ShortValueSummary: string
}

interface Milestone {
  id: string
  o: number
  value: MilestoneValue
}

interface MilestoneValue {
  Id: string
  Name: string
  TriggerValue: number
  Properties: Property[]
  Counter: Counter
}

interface Counter {
  Id: string
  Name: string
}

interface Property {
  Id: string
  Name: string
  Description: string
  RewardStrategy: string
  SelectionStrategyConfig: SelectionStrategyConfig2
  Rewards: PropertyReward[]
}

interface PropertyReward {
  Title?: string
  Details?: string
  Media?: Media
  ItemId?: string
  ItemType?: string
  LootReward?: LootReward
}

interface LootReward {
  Id: string
  LocalizedTitle: string
  LocalizedDetails: string
  RewardType: string
  Quantity: number
  Media: Media
  LootItemToGrant: null
  LegacyLootItem: string
}

interface Media {
  IconPath: IconPath
}

interface IconPath {
  Image: string
  SplashImage: string
}

interface SelectionStrategyConfig2 {
  SelectionStrategyConfig: SelectionStrategyConfig
}

interface SelectionStrategyConfig {
  MinSelectionsAllowed: number
  MaxSelectionsAllowed: number
}

interface MapDisplayInfoList {
  id: string
  o: number
  value: MapDisplayInfoListValue
}

interface MapDisplayInfoListValue {
  Name: string
  Bark: string
  BarkImage: string
  Map: StMap
  CompletedMapBoon: null
}

interface StMap {
  DisplayName: string
  ContentId: string
  OfferId: string
  ItemId: number
}

interface StAllowedChampions {
  champions: StAllowedChampions[]
}

interface StAllowedChampions {
  id: string
  o: number
  value: ChampionValue
}

interface ChampionValue {
  ContentId: string
  OfferId: string
  ItemId: number
}

export interface AccountScopeLoadouts {
  id: string
  itemId: null
  loadout: Loadout
  name: string
  refreshTime: string
  scope: string
}

interface Loadout {
  COMPANION_SLOT: COMPANIONSLOT
  EMOTES_ACE: COMPANIONSLOT
  EMOTES_FIRST_BLOOD: COMPANIONSLOT
  EMOTES_START: COMPANIONSLOT
  EMOTES_VICTORY: COMPANIONSLOT
  EMOTES_WHEEL_CENTER: COMPANIONSLOT
  EMOTES_WHEEL_LEFT: COMPANIONSLOT
  EMOTES_WHEEL_LOWER: COMPANIONSLOT
  EMOTES_WHEEL_LOWER_LEFT: COMPANIONSLOT
  EMOTES_WHEEL_LOWER_RIGHT: COMPANIONSLOT
  EMOTES_WHEEL_RIGHT: COMPANIONSLOT
  EMOTES_WHEEL_UPPER: COMPANIONSLOT
  EMOTES_WHEEL_UPPER_LEFT: COMPANIONSLOT
  EMOTES_WHEEL_UPPER_RIGHT: COMPANIONSLOT
  REGALIA_BANNER_SLOT: COMPANIONSLOT
  REGALIA_CREST_SLOT: COMPANIONSLOT
  STRAWBERRY_DIFFICULTY: COMPANIONSLOT
  STRAWBERRY_MAP_SLOT: COMPANIONSLOT
  TFT_MAP_SKIN_SLOT: COMPANIONSLOT
  TFT_PLAYBOOK_SLOT: COMPANIONSLOT
  TOURNAMENT_TROPHY: COMPANIONSLOT
  WARD_SKIN_SLOT: COMPANIONSLOT
}

interface COMPANIONSLOT {
  contentId: string
  inventoryType: string
  itemId: number
}

/**
 * 曾经用于判断是否是无限狂潮 (Swarm) 模式的英雄
 * @param id
 * @returns
 */
export function maybePveChampion(id: number) {
  return id >= 3000 && id < 4000
}
