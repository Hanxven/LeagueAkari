export interface BallotLegacy {
  eligiblePlayers: EligiblePlayerLegacy[]
  gameId: number
}

export interface EligiblePlayerLegacy {
  championName: string
  skinSplashPath: string
  summonerId: number
  summonerName: string
}

export interface BallotLegacy2 {
  eligibleAllies: any[]
  eligibleOpponents: any[]
  gameId: number
  honoredPlayers: any[]
  numVotes: number
}

export interface Ballot {
  eligibleAllies: EligiblePlayer[]
  eligibleOpponents: EligiblePlayer[]
  gameId: number
  honoredPlayers: {
    honorType: string
    recipientPuuid: string
  }[]
  votePool: VotePool
}

interface VotePool {
  fromGamePlayed: number
  fromHighHonor: number
  fromRecentHonors: number
  fromRollover: number
  votes: number
}

interface EligiblePlayer {
  botPlayer: boolean
  championName: string
  puuid: string
  role: string
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
