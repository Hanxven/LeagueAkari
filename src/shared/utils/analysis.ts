import { Game, Participant, isPveQueue } from '@shared/types/lcu/match-history'

const WIN_RATE_TEAM_THRESHOLD = 0.9418

export interface MatchHistoryWithState {
  game: Game
  isDetailed: boolean
}

export interface SelfParticipantGame extends MatchHistoryWithState {
  selfParticipant: Participant
}

export function getAnalysis(
  matchHistoryList: SelfParticipantGame[],
  sortBy: 'kda' | 'cherry' = 'kda'
): AnalysisResult {
  let kdaSum = 0
  let validGames = 0
  let totalGames = matchHistoryList.length
  let wins = 0
  let loses = 0
  let winningStreak = 0
  let losingStreak = 0
  let isOnWinningStreak = true
  let isOnLosingStreak = true
  let cherryTop2s = 0
  let cherryTop1s = 0
  let cherryGames = 0

  // 包括重开局在内的胜利，日后可能用于推测胜率队
  // 考虑到胜率队在撞车时会重开，这个可能没有那么准
  let trueWins = 0
  let trueValidGames = 0

  const map = new Map<
    number,
    {
      count: number
      cherryCount: number
      top1: number
      top2: number
      win: number
      kda: number
    }
  >()

  for (const game of matchHistoryList) {
    if (game.game.gameType !== 'MATCHED_GAME' || isPveQueue(game.game.queueId)) {
      continue
    }

    if (game.selfParticipant.stats.gameEndedInEarlySurrender) {
      trueValidGames++
      if (game.selfParticipant.stats.win) {
        trueWins++
      }
      continue
    }

    validGames++
    trueValidGames++

    if (!map.has(game.selfParticipant.championId)) {
      map.set(game.selfParticipant.championId, {
        count: 0,
        cherryCount: 0,
        win: 0,
        kda: 0,
        top1: 0,
        top2: 0
      })
    }

    const champ = map.get(game.selfParticipant.championId)!
    champ.count++
    champ.kda +=
      (game.selfParticipant.stats.kills + game.selfParticipant.stats.assists) /
      (game.selfParticipant.stats.deaths || 1)

    if (game.game.gameMode === 'CHERRY') {
      cherryGames++
      champ.cherryCount++
    }

    if (game.selfParticipant.stats.win) {
      isOnLosingStreak = false
      wins++

      if (game.game.gameMode === 'CHERRY') {
        const r = game.selfParticipant.stats.subteamPlacement
        if (r && r <= 2) {
          cherryTop2s++
          champ.top2++
          if (r === 1) {
            cherryTop1s++
            champ.top1++
          }
        }
      }

      if (isOnWinningStreak) {
        winningStreak++
      }

      trueWins++
      champ.win++
    } else {
      isOnWinningStreak = false
      loses++

      if (isOnLosingStreak) {
        losingStreak++
      }
    }

    kdaSum +=
      (game.selfParticipant.stats.kills + game.selfParticipant.stats.assists) /
      (game.selfParticipant.stats.deaths || 1)
  }

  for (const [_, info] of map) {
    info.kda /= info.count
  }

  const champions = Array.from(map)
    .sort((a, b) => {
      // 按照场数排列，相同则按照 KDA 排列
      if (sortBy === 'cherry') {
        return b[1].count === a[1].count ? b[1].top2 - a[1].top2 : b[1].count - a[1].count
      }
      return b[1].count === a[1].count ? b[1].kda - a[1].kda : b[1].count - a[1].count
    })
    .map((v) => ({
      championId: v[0],
      ...v[1]
    }))

  return {
    averageKda: kdaSum / (validGames || 1),
    validGames,
    winningRate: (wins / (validGames || 1)) * 100,
    cherryGames,
    cherryTop2s,
    cherryTop1s,
    winningStreak,
    losingStreak,
    totalGames,
    loses,
    wins,
    champions,
    maybeWinRateTeam: validGames >= 17 && wins / validGames > WIN_RATE_TEAM_THRESHOLD /* 0.9418 */
  }
}

export function withSelfParticipantMatchHistory(games: MatchHistoryWithState[], selfId: number) {
  const r = games.map((m) => {
    if (m.isDetailed) {
      const participantId = m.game.participantIdentities.find(
        (p) => p.player.summonerId === selfId
      )!.participantId

      const selfParticipant = m.game.participants.find((p) => participantId === p.participantId)!
      return {
        ...m,
        selfParticipant
      }
    } else {
      return {
        ...m,
        selfParticipant: m.game.participants[0]
      }
    }
  })

  return r
}

export interface AnalysisResult {
  averageKda: number
  validGames: number
  winningRate: number
  cherryGames: number
  cherryTop2s: number
  cherryTop1s: number
  winningStreak: number
  losingStreak: number
  totalGames: number
  loses: number
  wins: number
  champions: Array<{
    championId: number
    count: number
    cherryCount: number
    win: number
    kda: number
    top1: number
    top2: number
  }>
  maybeWinRateTeam: boolean
}

interface Player {
  id: number
  kda: number
}

// 暂未实装
export function findOutstandingPlayers(
  players: Player[],
  thresholdMultiplier: number = 1.5,
  includeAverage: boolean = true
): Player[] {
  if (players.length === 0) return []

  // 计算平均KDA
  const totalKda = players.reduce((acc, player) => acc + player.kda, 0)
  const averageKda = totalKda / players.length

  // 计算标准差
  const variance =
    players.reduce((acc, player) => acc + Math.pow(player.kda - averageKda, 2), 0) / players.length
  const standardDeviation = Math.sqrt(variance)

  // 根据是否包括平均值调整阈值的计算
  const threshold = includeAverage
    ? averageKda + thresholdMultiplier * standardDeviation
    : thresholdMultiplier * standardDeviation

  // 筛选出超过阈值的突出玩家
  const outstandingPlayers = players.filter((player) => player.kda > threshold)

  return outstandingPlayers
}
