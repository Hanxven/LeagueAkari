import { Game, MatchHistory } from '@renderer/types/match-history'

import { request } from './common'

export function getCurrentSummonerMatchHistory() {
  return request({
    url: '/lol-match-history/v1/products/lol/current-summoner/matches',
    method: 'GET'
  })
}

// 获取近期战绩，经过测试，每次最多只能获取 200 条
export function getMatchHistory(puuid: string, begIndex: number = 0, endIndex: number = 19) {
  return request<MatchHistory>({
    url: `/lol-match-history/v1/products/lol/${puuid}/matches`,
    method: 'GET',
    params: {
      begIndex,
      endIndex
    }
  })
}

export function getGame(gameId: number) {
  return request<Game>({
    url: `/lol-match-history/v1/games/${gameId}`,
    method: 'GET'
  })
}

// /lol-match-history/v3/matchlist/account/:accountId?begIndex=&endIndex=
