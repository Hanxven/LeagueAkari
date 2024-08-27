import { GameflowSession } from '@shared/types/lcu/gameflow'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { MatchHistoryGameWithState } from '@shared/utils/analysis'

export interface PlayerOngoingInformation {
  matchHistory: MatchHistoryGameWithState[]
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
export interface StatsSendExportedClass {
  name: string

  version: string

  id: string

  getStatLines(info: OngoingInformation, settings: Record<string, any>): string[]
}
