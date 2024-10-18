export interface ChampSelectSearch {
  dodgeData: DodgeData
  errors: any[]
  estimatedQueueTime: number
  isCurrentlyInQueue: boolean
  lobbyId: string
  lowPriorityData: LowPriorityData
  queueId: number
  readyCheck: ReadyCheck
  searchState: string
  timeInQueue: number
}

export interface ReadyCheck {
  declinerIds: any[]
  dodgeWarning: string
  playerResponse: string
  state: string
  suppressUx: boolean
  timer: number
}

export interface LowPriorityData {
  bustedLeaverAccessToken: string
  penalizedSummonerIds: any[]
  penaltyTime: number
  penaltyTimeRemaining: number
  reason: string
}

export interface GetSearch {
  dodgeData: DodgeData
  errors: Error[]
  estimatedQueueTime: number
  isCurrentlyInQueue: boolean
  lobbyId: string
  lowPriorityData: LowPriorityData
  queueId: number
  readyCheck: ReadyCheck
  searchState: string
  timeInQueue: number
}

export interface Error {
  errorType: string
  id: number
  message: string
  penalizedSummonerId: number
  penaltyTimeRemaining: number
}

export interface DodgeData {
  dodgerId: number
  state: string
}
