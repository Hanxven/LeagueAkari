export interface NormalizedExternalRunesDataSource {
  name: string
  version: string
  updateAt: Date

  getNormalizedChampionARAM(
    championId: number
  ): Promise<NormalizedChampionInformation> | NormalizedChampionInformation
}

export interface NormalizedChampionInformation {
  timeSelectionWinRate?: Array<{
    time: string
    winRate: number
  }> | null

  runes?: Array<{
    primaryPerks: number[]
    secondaryPerks: number[]
    statShards: number[]
    pickRate: number
    winRate: number
  }> | null

  spells?: Array<{
    spellIds: number[]
    pickRate: number
    winRate: number
  }> | null

  singleItems?: Array<{
    itemIds: number[]
    pickRate: number
    winRate: number
  }> | null

  staringItems?: Array<{
    itemIds: number[]
    pickRate: number
    winRate: number
  }> | null

  coreItems?: Array<{
    itemIds: number[]
    pickRate: number
    winRate: number
  }> | null

  shoes?: Array<{
    itemIds: number[]
    pickRate: number
    winRate: number
  }> | null

  // maybe only 101 has
  duoChampions?: Array<{
    championId: number
    pickRate: number
    winRate: number
  }> | null

  skillBuilds?: {
    skillLevelingOrder: number[] | number[][]
    skillUpgradeDetails: Array<{
      sequence: number[]
      pickRate: number
    }>
  } | null
}
