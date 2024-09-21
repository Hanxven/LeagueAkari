import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { Game, MatchHistory } from '@shared/types/lcu/match-history'

export function getCurrentSummonerMatchHistory() {
  return lcm.lcuRequest({
    url: '/lol-match-history/v1/products/lol/current-summoner/matches',
    method: 'GET'
  })
}

// 获取近期战绩，经过测试，每次最多只能获取 200 条
export function getMatchHistory(
  puuid: string,
  begIndex: number = 0,
  endIndex: number = 19,
  maxRetries = 3
) {
  return lcm.lcuRequest<MatchHistory>(
    {
      url: `/lol-match-history/v1/products/lol/${puuid}/matches`,
      method: 'GET',
      params: {
        begIndex,
        endIndex
      }
    },
    maxRetries
  )
}

export function getGame(gameId: number, maxRetries = 3) {
  return lcm.lcuRequest<Game>(
    {
      url: `/lol-match-history/v1/games/${gameId}`,
      method: 'GET'
    },
    maxRetries
  )
}

// /lol-match-history/v3/matchlist/account/:accountId?begIndex=&endIndex=
