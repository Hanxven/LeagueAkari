export interface BallotLegacy {
  eligiblePlayers: EligiblePlayer[]
  gameId: number
}

export interface EligiblePlayer {
  championName: string
  skinSplashPath: string
  summonerId: number
  summonerName: string
}

export interface BallotLegacy {
  eligibleAllies: any[]
  eligibleOpponents: any[]
  gameId: number
  honoredPlayers: any[]
  numVotes: number
}

export interface Recognition {
  honorCategory: string
  senderPuuid: string
  voterRelationship: string
}

export type HonorCategory = 'COOL' | 'HEART' | 'SHOTCALLER'
