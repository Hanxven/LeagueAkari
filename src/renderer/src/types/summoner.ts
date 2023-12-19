export interface SummonerInfo {
  accountId: number
  displayName: string
  internalName: string
  nameChangeFlag: boolean
  percentCompleteForNextLevel: number
  privacy: 'PUBLIC' | 'PRIVATE' | string
  profileIconId: number
  puuid: string
  rerollPoints: RerollPoints
  tagLine: string
  summonerId: number
  summonerLevel: number
  unnamed: boolean
  xpSinceLastLevel: number
  xpUntilNextLevel: number
}

export interface RerollPoints {
  currentPoints: number
  maxRolls: number
  numberOfRolls: number
  pointsCostToRoll: number
  pointsToReroll: number
}
