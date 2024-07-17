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
  // 总伤害（包括对其他非英雄单位的伤害）
  damageShareToTop: number
  physicalDamageShareToTop: number
  magicDamageShareToTop: number
  trueDamageShareToTop: number

  damageShareOfTeam: number
  physicalDamageShareOfTeam: number
  magicDamageShareOfTeam: number
  trueDamageShareOfTeam: number

  // 对英雄造成的伤害
  damageDealtToChampionShareToTop: number
  physicalDamageDealtToChampionShareToTop: number
  magicDamageDealtToChampionShareToTop: number
  trueDamageDealtToChampionShareToTop: number

  damageDealtToChampionShareOfTeam: number
  physicalDamageDealtToChampionShareOfTeam: number
  magicDamageDealtToChampionShareOfTeam: number
  trueDamageDealtToChampionShareOfTeam: number

  // 承受伤害系列
  damageTakenShareToTop: number
  physicalDamageTakenShareToTop: number
  magicDamageTakenShareToTop: number
  trueDamageTakenShareToTop: number

  damageTakenShareOfTeam: number
  physicalDamageTakenShareOfTeam: number
  magicDamageTakenShareOfTeam: number
  trueDamageTakenShareOfTeam: number

  selfMitigatedShareToTop: number
  selfMitigatedShareOfTeam: number

  healingShareToTop: number
  healingShareOfTeam: number

  towerDamageShareToTop: number
  towerDamageShareOfTeam: number

  // KDA 系列
  killParticipationRate: number
  kda: number

  // 补兵占比 (包括野怪和小兵)
  csShareToTop: number
  csShareOfTeam: number

  // 经济占比
  goldShareToTop: number
  goldShareOfTeam: number

  // -
  championId: number
}

export interface MatchHistoryGamesAnalysisSummary {
  averageDamageShareToTop: number
  averagePhysicalDamageShareToTop: number
  averageMagicDamageShareToTop: number
  averageTrueDamageShareToTop: number

  averageDamageShareOfTeam: number
  averagePhysicalDamageShareOfTeam: number
  averageMagicDamageShareOfTeam: number
  averageTrueDamageShareOfTeam: number

  averageDamageDealtToChampionShareToTop: number
  averagePhysicalDamageDealtToChampionShareToTop: number
  averageMagicDamageDealtToChampionShareToTop: number
  averageTrueDamageDealtToChampionShareToTop: number

  averageDamageDealtToChampionShareOfTeam: number
  averagePhysicalDamageDealtToChampionShareOfTeam: number
  averageMagicDamageDealtToChampionShareOfTeam: number
  averageTrueDamageDealtToChampionShareOfTeam: number

  averageDamageTakenShareToTop: number
  averagePhysicalDamageTakenShareToTop: number
  averageMagicDamageTakenShareToTop: number
  averageTrueDamageTakenShareToTop: number

  averageDamageTakenShareOfTeam: number
  averagePhysicalDamageTakenShareOfTeam: number
  averageMagicDamageTakenShareOfTeam: number
  averageTrueDamageTakenShareOfTeam: number

  averageKillParticipationRate: number
  averageKda: number

  averageCsShareToTop: number
  averageCsShareOfTeam: number

  averageGoldShareToTop: number
  averageGoldShareOfTeam: number

  win: number
  lose: number
  winRate: number
}

export interface MatchHistoryChampionAnalysis {
  count: number
  win: number
  lose: number
  winRate: number
}

export interface MatchHistoryGamesAnalysisAll {
  games: Record<number, MatchHistoryGamesAnalysis>
  summary: MatchHistoryGamesAnalysisSummary
  champions: Record<number, MatchHistoryChampionAnalysis>
}

/**
 * 根据玩家近期战绩分析数值
 * @param mh 玩家近期战绩，要求格式为 LCU-MatchHistory['games'][index]-like
 * @param selfPuuid 玩家 PUUID
 */
export function analyzeMatchHistory(
  games: MatchHistoryGameWithState[],
  selfPuuid: string,
  queueType?: number[]
): MatchHistoryGamesAnalysisAll | null {
  // 仅分析详细战绩，因为简略战绩会大幅减少分析的准确性
  const detailedGames = games
    .filter((g) => g.isDetailed)
    .filter((g) => !queueType || queueType.includes(g.game.queueId))
    .filter((g) => !g.game.participants.some((p) => p.stats.gameEndedInEarlySurrender))
    .filter((g) => g.game.gameType === 'MATCHED_GAME' && !isPveQueue(g.game.queueId))
    .map((g) => g.game)

  if (detailedGames.length === 0) {
    return null
  }

  let win = 0
  let lose = 0

  const champions: Record<number, MatchHistoryChampionAnalysis> = {}

  const gameAnalyses: [number, MatchHistoryGamesAnalysis][] = []
  for (let i = 0; i < detailedGames.length; i++) {
    const game = detailedGames[i]

    // 确定玩家在这场游戏中的参与者 ID
    const selfIdentity = game.participantIdentities.find((p) => p.player.puuid === selfPuuid)
    if (!selfIdentity) {
      continue
    }

    const watashi = game.participants.find((p) => p.participantId === selfIdentity.participantId)
    if (!watashi) {
      continue
    }

    if (watashi.stats.win) {
      win++
    } else {
      lose++
    }

    const gameAnalysis: MatchHistoryGamesAnalysis = {
      damageShareToTop: 0,
      physicalDamageShareToTop: 0,
      magicDamageShareToTop: 0,
      trueDamageShareToTop: 0,

      damageShareOfTeam: 0,
      physicalDamageShareOfTeam: 0,
      magicDamageShareOfTeam: 0,
      trueDamageShareOfTeam: 0,

      damageDealtToChampionShareToTop: 0,
      physicalDamageDealtToChampionShareToTop: 0,
      magicDamageDealtToChampionShareToTop: 0,
      trueDamageDealtToChampionShareToTop: 0,

      damageDealtToChampionShareOfTeam: 0,
      physicalDamageDealtToChampionShareOfTeam: 0,
      magicDamageDealtToChampionShareOfTeam: 0,
      trueDamageDealtToChampionShareOfTeam: 0,

      // 承受伤害系列
      damageTakenShareToTop: 0,
      physicalDamageTakenShareToTop: 0,
      magicDamageTakenShareToTop: 0,
      trueDamageTakenShareToTop: 0,

      damageTakenShareOfTeam: 0,
      physicalDamageTakenShareOfTeam: 0,
      magicDamageTakenShareOfTeam: 0,
      trueDamageTakenShareOfTeam: 0,

      towerDamageShareToTop: 0,
      towerDamageShareOfTeam: 0,

      selfMitigatedShareToTop: 0,
      selfMitigatedShareOfTeam: 0,

      healingShareToTop: 0,
      healingShareOfTeam: 0,

      // KDA 系列
      killParticipationRate: 0,

      kda: 0,

      // 补兵占比 (包括野怪和小兵)
      csShareToTop: 0,
      csShareOfTeam: 0,

      // 经济占比
      goldShareToTop: 0,
      goldShareOfTeam: 0,

      // -
      championId: 0
    }

    let maxDamageDealt = 0
    let maxPhysicalDamageDealt = 0
    let maxMagicDamageDealt = 0
    let maxTrueDamageDealt = 0
    let totalDamageDealt = 0
    let totalPhysicalDamageDealt = 0
    let totalMagicDamageDealt = 0
    let totalTrueDamageDealt = 0
    let maxDamageDealtToChampion = 0
    let maxPhysicalDamageDealtToChampion = 0
    let maxMagicDamageDealtToChampion = 0
    let maxTrueDamageDealtToChampion = 0
    let totalDamageDealtToChampion = 0
    let totalPhysicalDamageDealtToChampion = 0
    let totalMagicDamageDealtToChampion = 0
    let totalTrueDamageDealtToChampion = 0
    let maxDamageTaken = 0
    let maxPhysicalDamageTaken = 0
    let maxMagicDamageTaken = 0
    let maxTrueDamageTaken = 0
    let totalDamageTaken = 0
    let totalPhysicalDamageTaken = 0
    let totalMagicDamageTaken = 0
    let totalTrueDamageTaken = 0
    let maxSelfMitigated = 0
    let totalSelfMitigated = 0
    let maxHealing = 0
    let totalHealing = 0
    let maxTowerDamage = 0
    let totalTowerDamage = 0
    let kills = 0
    let deaths = 0
    let assists = 0
    let maxCs = 0
    let totalCs = 0
    let maxGold = 0
    let totalGold = 0

    let selfTeamParticipants: Participant[]
    if (game.gameMode === 'CHERRY') {
      selfTeamParticipants = game.participants.filter(
        (p) => p.stats.playerSubteamId === watashi.stats.playerSubteamId
      )
    } else {
      selfTeamParticipants = game.participants.filter((p) => p.teamId === watashi.teamId)
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

      totalDamageDealt += p.stats.totalDamageDealt
      totalPhysicalDamageDealt += p.stats.physicalDamageDealt
      totalMagicDamageDealt += p.stats.magicDamageDealt
      totalTrueDamageDealt += p.stats.trueDamageDealt
      totalDamageDealtToChampion += p.stats.totalDamageDealtToChampions
      totalPhysicalDamageDealtToChampion += p.stats.physicalDamageDealtToChampions
      totalMagicDamageDealtToChampion += p.stats.magicDamageDealtToChampions
      totalTrueDamageDealtToChampion += p.stats.trueDamageDealtToChampions
      totalDamageTaken += p.stats.totalDamageTaken
      totalPhysicalDamageTaken += p.stats.physicalDamageTaken
      totalMagicDamageTaken += p.stats.magicalDamageTaken
      totalTrueDamageTaken += p.stats.trueDamageTaken

      maxTowerDamage = Math.max(maxTowerDamage, p.stats.damageDealtToTurrets)
      totalTowerDamage += p.stats.damageDealtToTurrets

      maxSelfMitigated = Math.max(maxSelfMitigated, p.stats.damageSelfMitigated)
      totalSelfMitigated += p.stats.damageSelfMitigated

      maxHealing = Math.max(maxHealing, p.stats.totalHeal)
      totalHealing += p.stats.totalHeal

      kills += p.stats.kills
      deaths += p.stats.deaths
      assists += p.stats.assists

      maxCs = Math.max(maxCs, p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled)
      totalCs += p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled

      maxGold = Math.max(maxGold, p.stats.goldEarned)
      totalGold += p.stats.goldEarned
    }

    gameAnalysis.damageShareToTop = watashi.stats.totalDamageDealt / (maxDamageDealt || 1)
    gameAnalysis.physicalDamageShareToTop =
      watashi.stats.physicalDamageDealt / (maxPhysicalDamageDealt || 1)
    gameAnalysis.magicDamageShareToTop = watashi.stats.magicDamageDealt / (maxMagicDamageDealt || 1)
    gameAnalysis.trueDamageShareToTop = watashi.stats.trueDamageDealt / (maxTrueDamageDealt || 1)

    gameAnalysis.damageShareOfTeam = watashi.stats.totalDamageDealt / (totalDamageDealt || 1)
    gameAnalysis.physicalDamageShareOfTeam =
      watashi.stats.physicalDamageDealt / (totalPhysicalDamageDealt || 1)
    gameAnalysis.magicDamageShareOfTeam =
      watashi.stats.magicDamageDealt / (totalMagicDamageDealt || 1)
    gameAnalysis.trueDamageShareOfTeam = watashi.stats.trueDamageDealt / (totalTrueDamageDealt || 1)

    gameAnalysis.damageDealtToChampionShareToTop =
      watashi.stats.totalDamageDealtToChampions / (maxDamageDealtToChampion || 1)
    gameAnalysis.physicalDamageDealtToChampionShareToTop =
      watashi.stats.physicalDamageDealtToChampions / (maxPhysicalDamageDealtToChampion || 1)
    gameAnalysis.magicDamageDealtToChampionShareToTop =
      watashi.stats.magicDamageDealtToChampions / (maxMagicDamageDealtToChampion || 1)
    gameAnalysis.trueDamageDealtToChampionShareToTop =
      watashi.stats.trueDamageDealtToChampions / (maxTrueDamageDealtToChampion || 1)

    gameAnalysis.damageDealtToChampionShareOfTeam =
      watashi.stats.totalDamageDealtToChampions / (totalDamageDealtToChampion || 1)
    gameAnalysis.physicalDamageDealtToChampionShareOfTeam =
      watashi.stats.physicalDamageDealtToChampions / (totalPhysicalDamageDealtToChampion || 1)
    gameAnalysis.magicDamageDealtToChampionShareOfTeam =
      watashi.stats.magicDamageDealtToChampions / (totalMagicDamageDealtToChampion || 1)
    gameAnalysis.trueDamageDealtToChampionShareOfTeam =
      watashi.stats.trueDamageDealtToChampions / (totalTrueDamageDealtToChampion || 1)

    gameAnalysis.damageTakenShareToTop = watashi.stats.totalDamageTaken / (maxDamageTaken || 1)
    gameAnalysis.physicalDamageTakenShareToTop =
      watashi.stats.physicalDamageTaken / (maxPhysicalDamageTaken || 1)
    gameAnalysis.magicDamageTakenShareToTop =
      watashi.stats.magicalDamageTaken / (maxMagicDamageTaken || 1)
    gameAnalysis.trueDamageTakenShareToTop =
      watashi.stats.trueDamageTaken / (maxTrueDamageTaken || 1)

    gameAnalysis.damageTakenShareOfTeam = watashi.stats.totalDamageTaken / (totalDamageTaken || 1)
    gameAnalysis.physicalDamageTakenShareOfTeam =
      watashi.stats.physicalDamageTaken / (totalPhysicalDamageTaken || 1)
    gameAnalysis.magicDamageTakenShareOfTeam =
      watashi.stats.magicalDamageTaken / (totalMagicDamageTaken || 1)
    gameAnalysis.trueDamageTakenShareOfTeam =
      watashi.stats.trueDamageTaken / (totalTrueDamageTaken || 1)

    gameAnalysis.towerDamageShareToTop = watashi.stats.damageDealtToTurrets / (maxTowerDamage || 1)
    gameAnalysis.towerDamageShareOfTeam =
      watashi.stats.damageDealtToTurrets / (totalTowerDamage || 1)

    gameAnalysis.selfMitigatedShareToTop =
      watashi.stats.damageSelfMitigated / (maxSelfMitigated || 1)
    gameAnalysis.selfMitigatedShareOfTeam =
      watashi.stats.damageSelfMitigated / (totalSelfMitigated || 1)

    gameAnalysis.healingShareToTop = watashi.stats.totalHeal / (maxHealing || 1)
    gameAnalysis.healingShareOfTeam = watashi.stats.totalHeal / (totalHealing || 1)

    gameAnalysis.killParticipationRate =
      (watashi.stats.kills + watashi.stats.assists) / (kills || 1)
    gameAnalysis.kda = (watashi.stats.kills + watashi.stats.assists) / (watashi.stats.deaths || 1)

    gameAnalysis.csShareToTop =
      (watashi.stats.totalMinionsKilled + watashi.stats.neutralMinionsKilled) / (maxCs || 1)
    gameAnalysis.csShareOfTeam =
      (watashi.stats.totalMinionsKilled + watashi.stats.neutralMinionsKilled) / (totalCs || 1)

    gameAnalysis.goldShareToTop = watashi.stats.goldEarned / (maxGold || 1)
    gameAnalysis.goldShareOfTeam = watashi.stats.goldEarned / (totalGold || 1)

    gameAnalysis.championId = watashi.championId

    if (!champions[watashi.championId]) {
      champions[watashi.championId] = {
        count: 0,
        win: 0,
        lose: 0,
        winRate: 0
      }
    }

    champions[watashi.championId].count++
    if (watashi.stats.win) {
      champions[watashi.championId].win++
    } else {
      champions[watashi.championId].lose++
    }

    champions[watashi.championId].winRate =
      champions[watashi.championId].win / champions[watashi.championId].count

    gameAnalyses.push([game.gameId, gameAnalysis])
  }

  const gamesAnalysisMap = Object.fromEntries(gameAnalyses)

  const summary: MatchHistoryGamesAnalysisSummary = {
    averageDamageShareToTop: 0,
    averagePhysicalDamageShareToTop: 0,
    averageMagicDamageShareToTop: 0,
    averageTrueDamageShareToTop: 0,

    averageDamageShareOfTeam: 0,
    averagePhysicalDamageShareOfTeam: 0,
    averageMagicDamageShareOfTeam: 0,
    averageTrueDamageShareOfTeam: 0,

    averageDamageDealtToChampionShareToTop: 0,
    averagePhysicalDamageDealtToChampionShareToTop: 0,
    averageMagicDamageDealtToChampionShareToTop: 0,
    averageTrueDamageDealtToChampionShareToTop: 0,

    averageDamageDealtToChampionShareOfTeam: 0,
    averagePhysicalDamageDealtToChampionShareOfTeam: 0,
    averageMagicDamageDealtToChampionShareOfTeam: 0,
    averageTrueDamageDealtToChampionShareOfTeam: 0,

    averageDamageTakenShareToTop: 0,
    averagePhysicalDamageTakenShareToTop: 0,
    averageMagicDamageTakenShareToTop: 0,
    averageTrueDamageTakenShareToTop: 0,

    averageDamageTakenShareOfTeam: 0,
    averagePhysicalDamageTakenShareOfTeam: 0,
    averageMagicDamageTakenShareOfTeam: 0,
    averageTrueDamageTakenShareOfTeam: 0,

    averageKillParticipationRate: 0,
    averageKda: 0,

    averageCsShareToTop: 0,
    averageCsShareOfTeam: 0,

    averageGoldShareToTop: 0,
    averageGoldShareOfTeam: 0,

    winRate: win / (win + lose),
    win: win,
    lose: lose
  }

  let totalDamageShareToTop = 0
  let totalPhysicalDamageShareToTop = 0
  let totalMagicDamageShareToTop = 0
  let totalTrueDamageShareToTop = 0
  let totalDamageShareOfTeam = 0
  let totalPhysicalDamageShareOfTeam = 0
  let totalMagicDamageShareOfTeam = 0
  let totalTrueDamageShareOfTeam = 0

  let totalDamageDealtToChampionShareToTop = 0
  let totalPhysicalDamageDealtToChampionShareToTop = 0
  let totalMagicDamageDealtToChampionShareToTop = 0
  let totalTrueDamageDealtToChampionShareToTop = 0
  let totalDamageDealtToChampionOfTeam = 0
  let totalPhysicalDamageDealtToChampionOfTeam = 0
  let totalMagicDamageDealtToChampionOfTeam = 0
  let totalTrueDamageDealtToChampionOfTeam = 0

  let totalDamageTakenShareToTop = 0
  let totalPhysicalDamageTakenShareToTop = 0
  let totalMagicDamageTakenShareToTop = 0
  let totalTrueDamageTakenShareToTop = 0
  let totalDamageTakenOfTeam = 0
  let totalPhysicalDamageTakenOfTeam = 0
  let totalMagicDamageTakenOfTeam = 0
  let totalTrueDamageTakenOfTeam = 0

  let totalKillParticipationRate = 0
  let totalKda = 0

  let totalCsShareToTop = 0
  let totalCsShareOfTeam = 0

  let totalGoldShareToTop = 0
  let totalGoldShareOfTeam = 0

  for (const [_gameId, analysis] of gameAnalyses) {
    totalDamageShareToTop += analysis.damageShareToTop
    totalPhysicalDamageShareToTop += analysis.physicalDamageShareToTop
    totalMagicDamageShareToTop += analysis.magicDamageShareToTop
    totalTrueDamageShareToTop += analysis.trueDamageShareToTop

    totalDamageShareOfTeam += analysis.damageShareOfTeam
    totalPhysicalDamageShareOfTeam += analysis.physicalDamageShareOfTeam
    totalMagicDamageShareOfTeam += analysis.magicDamageShareOfTeam
    totalTrueDamageShareOfTeam += analysis.trueDamageShareOfTeam

    totalDamageDealtToChampionShareToTop += analysis.damageDealtToChampionShareToTop
    totalPhysicalDamageDealtToChampionShareToTop += analysis.physicalDamageDealtToChampionShareToTop
    totalMagicDamageDealtToChampionShareToTop += analysis.magicDamageDealtToChampionShareToTop
    totalTrueDamageDealtToChampionShareToTop += analysis.trueDamageDealtToChampionShareToTop

    totalDamageDealtToChampionOfTeam += analysis.damageDealtToChampionShareOfTeam
    totalPhysicalDamageDealtToChampionOfTeam += analysis.physicalDamageDealtToChampionShareOfTeam
    totalMagicDamageDealtToChampionOfTeam += analysis.magicDamageDealtToChampionShareOfTeam
    totalTrueDamageDealtToChampionOfTeam += analysis.trueDamageDealtToChampionShareOfTeam

    totalDamageTakenShareToTop += analysis.damageTakenShareToTop
    totalPhysicalDamageTakenShareToTop += analysis.physicalDamageTakenShareToTop
    totalMagicDamageTakenShareToTop += analysis.magicDamageTakenShareToTop
    totalTrueDamageTakenShareToTop += analysis.trueDamageTakenShareToTop

    totalDamageTakenOfTeam += analysis.damageTakenShareOfTeam
    totalPhysicalDamageTakenOfTeam += analysis.physicalDamageTakenShareOfTeam
    totalMagicDamageTakenOfTeam += analysis.magicDamageTakenShareOfTeam
    totalTrueDamageTakenOfTeam += analysis.trueDamageTakenShareOfTeam

    totalKillParticipationRate += analysis.killParticipationRate
    totalKda += analysis.kda

    totalCsShareToTop += analysis.csShareToTop
    totalCsShareOfTeam += analysis.csShareOfTeam

    totalGoldShareToTop += analysis.goldShareToTop
    totalGoldShareOfTeam += analysis.goldShareOfTeam
  }

  // for summary calculation

  summary.averageDamageShareToTop = totalDamageShareToTop / (gameAnalyses.length || 1)
  summary.averagePhysicalDamageShareToTop =
    totalPhysicalDamageShareToTop / (gameAnalyses.length || 1)
  summary.averageMagicDamageShareToTop = totalMagicDamageShareToTop / (gameAnalyses.length || 1)
  summary.averageTrueDamageShareToTop = totalTrueDamageShareToTop / (gameAnalyses.length || 1)

  summary.averageDamageShareOfTeam = totalDamageShareOfTeam / (gameAnalyses.length || 1)
  summary.averagePhysicalDamageShareOfTeam =
    totalPhysicalDamageShareOfTeam / (gameAnalyses.length || 1)
  summary.averageMagicDamageShareOfTeam = totalMagicDamageShareOfTeam / (gameAnalyses.length || 1)
  summary.averageTrueDamageShareOfTeam = totalTrueDamageShareOfTeam / (gameAnalyses.length || 1)

  summary.averageDamageDealtToChampionShareToTop =
    totalDamageDealtToChampionShareToTop / (gameAnalyses.length || 1)
  summary.averagePhysicalDamageDealtToChampionShareToTop =
    totalPhysicalDamageDealtToChampionShareToTop / (gameAnalyses.length || 1)
  summary.averageMagicDamageDealtToChampionShareToTop =
    totalMagicDamageDealtToChampionShareToTop / (gameAnalyses.length || 1)
  summary.averageTrueDamageDealtToChampionShareToTop =
    totalTrueDamageDealtToChampionShareToTop / (gameAnalyses.length || 1)

  summary.averageDamageDealtToChampionShareOfTeam =
    totalDamageDealtToChampionOfTeam / (gameAnalyses.length || 1)
  summary.averagePhysicalDamageDealtToChampionShareOfTeam =
    totalPhysicalDamageDealtToChampionOfTeam / (gameAnalyses.length || 1)
  summary.averageMagicDamageDealtToChampionShareOfTeam =
    totalMagicDamageDealtToChampionOfTeam / (gameAnalyses.length || 1)
  summary.averageTrueDamageDealtToChampionShareOfTeam =
    totalTrueDamageDealtToChampionOfTeam / (gameAnalyses.length || 1)

  summary.averageDamageTakenShareToTop = totalDamageTakenShareToTop / (gameAnalyses.length || 1)
  summary.averagePhysicalDamageTakenShareToTop =
    totalPhysicalDamageTakenShareToTop / (gameAnalyses.length || 1)
  summary.averageMagicDamageTakenShareToTop =
    totalMagicDamageTakenShareToTop / (gameAnalyses.length || 1)
  summary.averageTrueDamageTakenShareToTop =
    totalTrueDamageTakenShareToTop / (gameAnalyses.length || 1)

  summary.averageDamageTakenShareOfTeam = totalDamageTakenOfTeam / (gameAnalyses.length || 1)
  summary.averagePhysicalDamageTakenShareOfTeam =
    totalPhysicalDamageTakenOfTeam / (gameAnalyses.length || 1)
  summary.averageMagicDamageTakenShareOfTeam =
    totalMagicDamageTakenOfTeam / (gameAnalyses.length || 1)
  summary.averageTrueDamageTakenShareOfTeam =
    totalTrueDamageTakenOfTeam / (gameAnalyses.length || 1)

  summary.averageKillParticipationRate = totalKillParticipationRate / (gameAnalyses.length || 1)

  summary.averageKda = totalKda / (gameAnalyses.length || 1)

  summary.averageCsShareToTop = totalCsShareToTop / (gameAnalyses.length || 1)
  summary.averageCsShareOfTeam = totalCsShareOfTeam / (gameAnalyses.length || 1)

  summary.averageGoldShareToTop = totalGoldShareToTop / (gameAnalyses.length || 1)
  summary.averageGoldShareOfTeam = totalGoldShareOfTeam / (gameAnalyses.length || 1)

  return {
    games: gamesAnalysisMap,
    summary: summary,
    champions: champions
  }
}

export interface MatchHistoryGamesAnalysisTeamSide {
  averageWinRate: number
  averageKda: number
}

export function analyzeTeamMatchHistory(
  analyses: MatchHistoryGamesAnalysisAll[]
): MatchHistoryGamesAnalysisTeamSide | null {
  if (analyses.length === 0) {
    return null
  }

  let totalWinRate = 0
  let totalKda = 0

  for (const analysis of analyses) {
    totalWinRate += analysis.summary.winRate
    totalKda += analysis.summary.averageKda
  }

  return {
    averageWinRate: totalWinRate / analyses.length,
    averageKda: totalKda / analyses.length
  }
}
