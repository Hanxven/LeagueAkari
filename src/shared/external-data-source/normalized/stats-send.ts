import { GameflowSession } from '@shared/types/lcu/gameflow'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { MatchHistoryWithState } from '@shared/utils/analysis'

import { AkariApi } from './akari-vm'

export interface PlayerOngoingInformation {
  matchHistory: MatchHistoryWithState[]
  summoner?: SummonerInfo
  rankedStats?: RankedStats
}

export interface OngoingInformation {
  playerStats: Record<number, PlayerOngoingInformation>
  gameflowSession: GameflowSession
}

/**
 * 必须实现的功能
 */
export interface StatsSend {
  name: string

  version: string

  id: string

  getStatLines(info: OngoingInformation): string[]
}
