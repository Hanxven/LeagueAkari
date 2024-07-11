import { Game, MatchHistory, Participant, isPveQueue } from '@shared/types/lcu/match-history'

const WIN_RATE_TEAM_THRESHOLD = 0.9418

export interface MatchHistoryGameWithState {
  game: Game
  isDetailed: boolean
}

export interface SelfParticipantGame extends MatchHistoryGameWithState {
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
  let cherryTop4s = 0
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
      top4: number
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
        top4: 0
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
        if (r && r <= 4) {
          cherryTop4s++
          champ.top4++
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
        return b[1].count === a[1].count ? b[1].top4 - a[1].top4 : b[1].count - a[1].count
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
    cherryTop4s,
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

export function withSelfParticipantMatchHistory(
  games: MatchHistoryGameWithState[],
  selfPuuid: string
) {
  const r = games.map((m) => {
    if (m.isDetailed) {
      const participantId = m.game.participantIdentities.find(
        (p) => p.player.puuid === selfPuuid
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
  cherryTop4s: number
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
    top4: number
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

export interface MatchHistoryGamesAnalysis {
  // 伤害系列，仅计算对英雄伤害
  damageShareToTop: number
  physicalDamageShareToTop: number
  magicDamageShareToTop: number
  trueDamageShareToTop: number

  // 所有伤害来源
  damageDealtToChampionShareToTop: number
  physicalDamageDealtToChampionShareToTop: number
  magicDamageDealtToChampionShareToTop: number
  trueDamageDealtToChampionShareToTop: number

  // 承受伤害系列
  damageTakenShareToTop: number
  physicalDamageTakenShareToTop: number
  magicDamageTakenShareToTop: number
  trueDamageTakenShareToTop: number

  // KDA 系列
  killParticipationRate: number

  kda: number

  // 补兵占比 (包括野怪和小兵)
  csShareToTop: number

  // 经济占比
  goldShareToTop: number

  // -
  championId: number
}

export interface MatchHistoryGamesAnalysisSummary {
  averageDamageShareToTop: number
  averagePhysicalDamageShareToTop: number
  averageMagicDamageShareToTop: number
  averageTrueDamageShareToTop: number

  averageDamageDealtToChampionShareToTop: number
  averagePhysicalDamageDealtToChampionShareToTop: number
  averageMagicDamageDealtToChampionShareToTop: number
  averageTrueDamageDealtToChampionShareToTop: number

  averageDamageTakenShareToTop: number
  averagePhysicalDamageTakenShareToTop: number
  averageMagicDamageTakenShareToTop: number
  averageTrueDamageTakenShareToTop: number

  averageKillParticipationRate: number
  averageKda: number

  averageCsShareToTop: number

  averageGoldShareToTop: number
}

export interface MatchHistoryGamesAnalysisAll {
  games: Record<number, MatchHistoryGamesAnalysis>
  summary: MatchHistoryGamesAnalysisSummary
}

/**
 * 根据玩家近期战绩分析数值，新的 API
 * @param mh 玩家近期战绩，要求格式为 LCU-MatchHistory['games'][index]-like
 * @param selfPuuid 玩家 PUUID
 */
export function analyzeMatchHistory(
  games: MatchHistoryGameWithState[],
  selfPuuid: string,
  queueType?: number[]
): MatchHistoryGamesAnalysisAll {
  // 仅分析详细战绩，因为简略战绩会大幅减少分析的准确性
  const detailedGames = games
    .filter((g) => g.isDetailed)
    .filter((g) => !queueType || queueType.includes(g.game.queueId))
    .map((g) => g.game)

  const gameAnalysisList: [number, MatchHistoryGamesAnalysis][] = []
  for (let i = 0; i < detailedGames.length; i++) {
    const game = detailedGames[i]

    // 确定玩家在这场游戏中的参与者 ID
    const selfPi = game.participantIdentities.find((p) => p.player.puuid === selfPuuid)
    if (!selfPi) {
      continue
    }

    const selfP = game.participants.find((p) => p.participantId === selfPi.participantId)
    if (!selfP) {
      continue
    }

    const gameAnalysis: MatchHistoryGamesAnalysis = {
      // 伤害系列，仅计算对英雄伤害
      damageShareToTop: 0,
      physicalDamageShareToTop: 0,
      magicDamageShareToTop: 0,
      trueDamageShareToTop: 0,

      // 所有伤害来源
      damageDealtToChampionShareToTop: 0,
      physicalDamageDealtToChampionShareToTop: 0,
      magicDamageDealtToChampionShareToTop: 0,
      trueDamageDealtToChampionShareToTop: 0,

      // 承受伤害系列
      damageTakenShareToTop: 0,
      physicalDamageTakenShareToTop: 0,
      magicDamageTakenShareToTop: 0,
      trueDamageTakenShareToTop: 0,

      // KDA 系列
      killParticipationRate: 0,

      kda: 0,

      // 补兵占比 (包括野怪和小兵)
      csShareToTop: 0,

      // 经济占比
      goldShareToTop: 0,

      // -
      championId: 0
    }

    let maxDamageDealt = 0
    let maxPhysicalDamageDealt = 0
    let maxMagicDamageDealt = 0
    let maxTrueDamageDealt = 0
    let maxDamageDealtToChampion = 0
    let maxPhysicalDamageDealtToChampion = 0
    let maxMagicDamageDealtToChampion = 0
    let maxTrueDamageDealtToChampion = 0
    let maxDamageTaken = 0
    let maxPhysicalDamageTaken = 0
    let maxMagicDamageTaken = 0
    let maxTrueDamageTaken = 0
    let kills = 0
    let deaths = 0
    let assists = 0
    let maxCs = 0
    let maxGold = 0

    let selfTeamParticipants: Participant[]
    if (game.gameMode === 'CHERRY') {
      selfTeamParticipants = game.participants.filter(
        (p) => p.stats.playerSubteamId === selfP.stats.playerSubteamId
      )
    } else {
      selfTeamParticipants = game.participants.filter((p) => p.teamId === selfP.teamId)
    }

    for (const p of selfTeamParticipants) {
      maxDamageDealt = Math.max(maxDamageDealt, p.stats.totalDamageDealt)
      maxPhysicalDamageDealt = Math.max(maxPhysicalDamageDealt, p.stats.physicalDamageDealt)
      maxMagicDamageDealt = Math.max(maxMagicDamageDealt, p.stats.magicDamageDealt)
      maxTrueDamageDealt = Math.max(maxTrueDamageDealt, p.stats.trueDamageDealt)
      maxDamageDealtToChampion = Math.max(
        maxDamageDealtToChampion,
        p.stats.totalDamageDealtToChampions
      )
      maxPhysicalDamageDealtToChampion = Math.max(
        maxPhysicalDamageDealtToChampion,
        p.stats.physicalDamageDealtToChampions
      )
      maxMagicDamageDealtToChampion = Math.max(
        maxMagicDamageDealtToChampion,
        p.stats.magicDamageDealtToChampions
      )
      maxTrueDamageDealtToChampion = Math.max(
        maxTrueDamageDealtToChampion,
        p.stats.trueDamageDealtToChampions
      )
      maxDamageTaken = Math.max(maxDamageTaken, p.stats.totalDamageTaken)
      maxPhysicalDamageTaken = Math.max(maxPhysicalDamageTaken, p.stats.physicalDamageTaken)
      maxMagicDamageTaken = Math.max(maxMagicDamageTaken, p.stats.magicalDamageTaken)
      maxTrueDamageTaken = Math.max(maxTrueDamageTaken, p.stats.trueDamageTaken)

      kills += p.stats.kills
      deaths += p.stats.deaths
      assists += p.stats.assists

      maxCs = Math.max(maxCs, p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled)
      maxGold = Math.max(maxGold, p.stats.goldEarned)
    }

    gameAnalysis.damageShareToTop = selfP.stats.totalDamageDealt / (maxDamageDealt || 1)
    gameAnalysis.physicalDamageShareToTop =
      selfP.stats.physicalDamageDealt / (maxPhysicalDamageDealt || 1)
    gameAnalysis.magicDamageShareToTop = selfP.stats.magicDamageDealt / (maxMagicDamageDealt || 1)
    gameAnalysis.trueDamageShareToTop = selfP.stats.trueDamageDealt / (maxTrueDamageDealt || 1)

    gameAnalysis.damageDealtToChampionShareToTop =
      selfP.stats.totalDamageDealtToChampions / (maxDamageDealtToChampion || 1)
    gameAnalysis.physicalDamageDealtToChampionShareToTop =
      selfP.stats.physicalDamageDealtToChampions / (maxPhysicalDamageDealtToChampion || 1)
    gameAnalysis.magicDamageDealtToChampionShareToTop =
      selfP.stats.magicDamageDealtToChampions / (maxMagicDamageDealtToChampion || 1)
    gameAnalysis.trueDamageDealtToChampionShareToTop =
      selfP.stats.trueDamageDealtToChampions / (maxTrueDamageDealtToChampion || 1)

    gameAnalysis.damageTakenShareToTop = selfP.stats.totalDamageTaken / (maxDamageDealt || 1)
    gameAnalysis.physicalDamageTakenShareToTop =
      selfP.stats.physicalDamageTaken / (maxPhysicalDamageDealt || 1)
    gameAnalysis.magicDamageTakenShareToTop =
      selfP.stats.magicalDamageTaken / (maxMagicDamageDealt || 1)
    gameAnalysis.trueDamageTakenShareToTop = selfP.stats.trueDamageTaken / (maxTrueDamageDealt || 1)

    gameAnalysis.killParticipationRate = (selfP.stats.kills + selfP.stats.assists) / (kills || 1)
    gameAnalysis.kda = (selfP.stats.kills + selfP.stats.assists) / (selfP.stats.deaths || 1)

    gameAnalysis.csShareToTop =
      (selfP.stats.totalMinionsKilled + selfP.stats.neutralMinionsKilled) / (maxCs || 1)
    gameAnalysis.goldShareToTop = selfP.stats.goldEarned / (maxGold || 1)

    gameAnalysis.championId = selfP.championId

    gameAnalysisList.push([game.gameId, gameAnalysis])
  }

  const gamesAnalysisMap = Object.fromEntries(gameAnalysisList)

  const summary: MatchHistoryGamesAnalysisSummary = {
    averageDamageShareToTop: 0,
    averagePhysicalDamageShareToTop: 0,
    averageMagicDamageShareToTop: 0,
    averageTrueDamageShareToTop: 0,

    averageDamageDealtToChampionShareToTop: 0,
    averagePhysicalDamageDealtToChampionShareToTop: 0,
    averageMagicDamageDealtToChampionShareToTop: 0,
    averageTrueDamageDealtToChampionShareToTop: 0,

    averageDamageTakenShareToTop: 0,
    averagePhysicalDamageTakenShareToTop: 0,
    averageMagicDamageTakenShareToTop: 0,
    averageTrueDamageTakenShareToTop: 0,

    averageKillParticipationRate: 0,
    averageKda: 0,

    averageCsShareToTop: 0,

    averageGoldShareToTop: 0
  }

  let totalDamageShareToTop = 0
  let totalPhysicalDamageShareToTop = 0
  let totalMagicDamageShareToTop = 0
  let totalTrueDamageShareToTop = 0

  let totalDamageDealtToChampionShareToTop = 0
  let totalPhysicalDamageDealtToChampionShareToTop = 0
  let totalMagicDamageDealtToChampionShareToTop = 0
  let totalTrueDamageDealtToChampionShareToTop = 0

  let totalDamageTakenShareToTop = 0
  let totalPhysicalDamageTakenShareToTop = 0
  let totalMagicDamageTakenShareToTop = 0
  let totalTrueDamageTakenShareToTop = 0

  let totalKillParticipationRate = 0
  let totalKda = 0

  let totalCsShareToTop = 0

  let totalGoldShareToTop = 0

  for (const [_gameId, analysis] of gameAnalysisList) {
    totalDamageShareToTop += analysis.damageShareToTop
    totalPhysicalDamageShareToTop += analysis.physicalDamageShareToTop
    totalMagicDamageShareToTop += analysis.magicDamageShareToTop
    totalTrueDamageShareToTop += analysis.trueDamageShareToTop

    totalDamageDealtToChampionShareToTop += analysis.damageDealtToChampionShareToTop
    totalPhysicalDamageDealtToChampionShareToTop += analysis.physicalDamageDealtToChampionShareToTop
    totalMagicDamageDealtToChampionShareToTop += analysis.magicDamageDealtToChampionShareToTop
    totalTrueDamageDealtToChampionShareToTop += analysis.trueDamageDealtToChampionShareToTop

    totalDamageTakenShareToTop += analysis.damageTakenShareToTop
    totalPhysicalDamageTakenShareToTop += analysis.physicalDamageTakenShareToTop
    totalMagicDamageTakenShareToTop += analysis.magicDamageTakenShareToTop
    totalTrueDamageTakenShareToTop += analysis.trueDamageTakenShareToTop

    totalKillParticipationRate += analysis.killParticipationRate
    totalKda += analysis.kda

    totalCsShareToTop += analysis.csShareToTop

    totalGoldShareToTop += analysis.goldShareToTop
  }

  // for summary calculation

  summary.averageDamageShareToTop = totalDamageShareToTop / (gameAnalysisList.length || 1)
  summary.averagePhysicalDamageShareToTop =
    totalPhysicalDamageShareToTop / (gameAnalysisList.length || 1)
  summary.averageMagicDamageShareToTop = totalMagicDamageShareToTop / (gameAnalysisList.length || 1)
  summary.averageTrueDamageShareToTop = totalTrueDamageShareToTop / (gameAnalysisList.length || 1)

  summary.averageDamageDealtToChampionShareToTop =
    totalDamageDealtToChampionShareToTop / (gameAnalysisList.length || 1)
  summary.averagePhysicalDamageDealtToChampionShareToTop =
    totalPhysicalDamageDealtToChampionShareToTop / (gameAnalysisList.length || 1)
  summary.averageMagicDamageDealtToChampionShareToTop =
    totalMagicDamageDealtToChampionShareToTop / (gameAnalysisList.length || 1)
  summary.averageTrueDamageDealtToChampionShareToTop =
    totalTrueDamageDealtToChampionShareToTop / (gameAnalysisList.length || 1)

  summary.averageDamageTakenShareToTop = totalDamageTakenShareToTop / (gameAnalysisList.length || 1)
  summary.averagePhysicalDamageTakenShareToTop =
    totalPhysicalDamageTakenShareToTop / (gameAnalysisList.length || 1)
  summary.averageMagicDamageTakenShareToTop =
    totalMagicDamageTakenShareToTop / (gameAnalysisList.length || 1)
  summary.averageTrueDamageTakenShareToTop =
    totalTrueDamageTakenShareToTop / (gameAnalysisList.length || 1)

  summary.averageKillParticipationRate = totalKillParticipationRate / (gameAnalysisList.length || 1)

  summary.averageKda = totalKda / (gameAnalysisList.length || 1)

  summary.averageCsShareToTop = totalCsShareToTop / (gameAnalysisList.length || 1)

  summary.averageGoldShareToTop = totalGoldShareToTop / (gameAnalysisList.length || 1)

  return {
    games: gamesAnalysisMap,
    summary: summary
  }
}
