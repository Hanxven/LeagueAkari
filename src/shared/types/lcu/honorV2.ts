export interface Ballot {
  eligiblePlayers: EligiblePlayer[]
  gameId: number
}

export interface EligiblePlayer {
  championName: string
  skinSplashPath: string
  summonerId: number
  summonerName: string
}

export interface Recognition {
  honorCategory: string
  senderPuuid: string
  voterRelationship: string
}

export type HonorCategory = 'COOL' | 'HEART' | 'SHOTCALLER'
