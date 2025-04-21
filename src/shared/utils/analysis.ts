import {
  Game,
  GameTimeline,
  Participant,
  ParticipantIdentity,
  isPveQueue
} from '@shared/types/league-client/match-history'

const SUMMONER_SPELL_FLASH_ID = 4

export interface MatchHistoryGameWithState {
  game: Game
  isDetailed: boolean
}

export interface SelfParticipantGame extends MatchHistoryGameWithState {
  selfParticipant: Participant
}

export function withSelfParticipantMatchHistory(
  games: MatchHistoryGameWithState[],
  selfPuuid: string
) {
  const r = games.map((m) => {
    if (m.isDetailed) {
      const participantId = m.game.participantIdentities.find(
        (p) => p.player.puuid === selfPuuid
      )?.participantId

      const selfParticipant = m.game.participants.find((p) => participantId === p.participantId)

      if (!selfParticipant) {
        return null
      }

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

  return r.filter((v) => v !== null) as SelfParticipantGame[]
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

interface PlayerWithKda {
  id: number
  kda: number
}

interface SoloKillInfo {
  time: number
  position: {
    x: number
    y: number
  }
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
  kd: number

  kills: number
  deaths: number
  assists: number

  // 补兵占比 (包括野怪和小兵)
  csShareToTop: number
  csShareOfTeam: number
  csPerMinute: number

  // 经济占比
  goldShareToTop: number
  goldShareOfTeam: number

  // 经济转换率
  damageGoldEfficiency: number

  win: boolean

  visionScore: number

  // -
  championId: number

  // SGP 数据字段 teamPosition, 若不存在则为空字符串
  position: string | null

  // SGP 数据字段 enemyMissingPings, 若不存在则为 null
  enemyMissingPings: number | null

  // timeline
  soloKills: SoloKillInfo[] | null
  soloDeaths: SoloKillInfo[] | null

  // 杂项
  flashSlot: 'D' | 'F' | null
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
  averageKd: number
  kdaCv: number

  averageCsShareToTop: number
  averageCsShareOfTeam: number
  averageCsPerMinute: number

  averageGoldShareToTop: number
  averageGoldShareOfTeam: number

  averageVisionScore: number

  averageDamageGoldEfficiency: number

  totalKills: number
  totalDeaths: number
  totalAssists: number

  win: number
  lose: number
  winRate: number

  winningStreak: number
  losingStreak: number

  count: number

  cherry: {
    count: number
    win: number
    lose: number
    first: number
    winRate: number
    top1Rate: number
  }

  // 杂项
  flashOnD: number
  flashOnF: number

  sinceLast: number

  // SGP Only
  averageEnemyMissingPings: number | null
}

export interface MatchHistoryChampionAnalysis {
  id: number
  count: number
  win: number
  lose: number
  winRate: number
  cherry: {
    count: number
    win: number
    lose: number
    first: number
    winRate: number
    firstRate: number
  }
}

export interface MatchHistoryChampionPositionAnalysis {
  /**
   * 提供了位置信息的比赛数量
   */
  total: number

  positions: {
    TOP: number
    JUNGLE: number
    MIDDLE: number
    BOTTOM: number
    UTILITY: number
  }
}

export interface MatchHistoryGamesAnalysisAll {
  games: Record<number, MatchHistoryGamesAnalysis>
  summary: MatchHistoryGamesAnalysisSummary
  champions: Record<number, MatchHistoryChampionAnalysis>
  positions: MatchHistoryChampionPositionAnalysis | null
  akariScore: AkariScore
}

/**
 * 根据玩家近期战绩分析数值
 * @param mh 玩家近期战绩，要求格式为 LCU-MatchHistory['games'][index]-like
 * @param selfPuuid 玩家 PUUID
 */
export function analyzeMatchHistory(
  games: MatchHistoryGameWithState[],
  selfPuuid: string,
  queueType: number[] | null = null,
  gameTimeline: Record<number, GameTimeline> = {}
): MatchHistoryGamesAnalysisAll | null {
  const detailedGames = games
    .filter((g) => g.isDetailed)
    .filter((g) => !queueType || queueType.includes(g.game.queueId))
    .filter((g) => !g.game.participants.some((p) => p.stats.gameEndedInEarlySurrender))
    .filter((g) => g.game.endOfGameResult !== 'Abort_AntiCheatExit')
    .filter((g) => g.game.gameType === 'MATCHED_GAME' && !isPveQueue(g.game.queueId))
    .map((g) => g.game)

  if (detailedGames.length === 0) {
    return null
  }

  let win = 0
  let lose = 0
  let cherryLost = 0
  let cherryWin = 0
  let cherryCount = 0
  let cherryFirst = 0
  let winningStreak = 0
  let losingStreak = 0
  let isOnWinningStreak = true
  let isOnLosingStreak = true

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

    if (isOnWinningStreak && watashi.stats.win) {
      winningStreak++
    } else {
      isOnWinningStreak = false
    }

    if (isOnLosingStreak && !watashi.stats.win) {
      losingStreak++
    } else {
      isOnLosingStreak = false
    }

    if (game.gameMode === 'CHERRY') {
      cherryCount++
      if (watashi.stats.subteamPlacement === 1) {
        cherryFirst++
      }

      if (watashi.stats.win) {
        cherryWin++
      } else {
        cherryLost++
      }
    }

    let flashSlot: 'D' | 'F' | null = null
    if (watashi.spell1Id === SUMMONER_SPELL_FLASH_ID) {
      flashSlot = 'F'
    } else if (watashi.spell2Id === SUMMONER_SPELL_FLASH_ID) {
      flashSlot = 'D'
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

      kda: (watashi.stats.kills + watashi.stats.assists) / (watashi.stats.deaths || 1),
      kd: watashi.stats.kills / (watashi.stats.deaths || 1),
      kills: watashi.stats.kills,
      deaths: watashi.stats.deaths,
      assists: watashi.stats.assists,

      // 补兵占比 (包括野怪和小兵)
      csShareToTop: 0,
      csShareOfTeam: 0,
      csPerMinute:
        (watashi.stats.totalMinionsKilled + watashi.stats.neutralMinionsKilled) /
        (game.gameDuration / 60),

      // 经济占比
      goldShareToTop: 0,
      goldShareOfTeam: 0,

      visionScore: watashi.stats.visionScore,

      // 经济转换率
      damageGoldEfficiency: Math.min(
        watashi.stats.totalDamageDealtToChampions / watashi.stats.goldEarned,
        99999
      ),

      win: watashi.stats.win,

      // -
      championId: watashi.championId,

      // sgp only
      position: watashi.stats.teamPosition || null,
      enemyMissingPings: watashi.stats.enemyMissingPings ?? null,

      // timeline
      soloKills: null,
      soloDeaths: null,

      // 杂项
      flashSlot
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

    gameAnalysis.csShareToTop =
      (watashi.stats.totalMinionsKilled + watashi.stats.neutralMinionsKilled) / (maxCs || 1)
    gameAnalysis.csShareOfTeam =
      (watashi.stats.totalMinionsKilled + watashi.stats.neutralMinionsKilled) / (totalCs || 1)

    gameAnalysis.goldShareToTop = watashi.stats.goldEarned / (maxGold || 1)
    gameAnalysis.goldShareOfTeam = watashi.stats.goldEarned / (totalGold || 1)

    if (!champions[watashi.championId]) {
      champions[watashi.championId] = {
        id: watashi.championId,
        count: 0,
        win: 0,
        lose: 0,
        winRate: 0,
        cherry: {
          count: 0,
          win: 0,
          lose: 0,
          first: 0,
          winRate: 0,
          firstRate: 0
        }
      }
    }

    champions[watashi.championId].count++
    if (watashi.stats.win) {
      champions[watashi.championId].win++
    } else {
      champions[watashi.championId].lose++
    }

    if (game.gameMode === 'CHERRY') {
      champions[watashi.championId].cherry.count++
      if (watashi.stats.win) {
        champions[watashi.championId].cherry.win++
      } else {
        champions[watashi.championId].cherry.lose++
      }

      if (watashi.stats.subteamPlacement === 1) {
        champions[watashi.championId].cherry.first++
      }
    }

    champions[watashi.championId].winRate =
      champions[watashi.championId].win / champions[watashi.championId].count

    champions[watashi.championId].cherry.winRate =
      champions[watashi.championId].cherry.win / champions[watashi.championId].cherry.count

    // timeline 分析
    const thisGameTimeline = gameTimeline[game.gameId]

    if (thisGameTimeline && thisGameTimeline.frames) {
      const soloKills: SoloKillInfo[] = []
      const soloDeaths: SoloKillInfo[] = []

      for (const frame of thisGameTimeline.frames) {
        frame.events.forEach((event) => {
          // 单杀
          if (event.type === 'CHAMPION_KILL' && !event.assistingParticipantIds.length) {
            if (watashi.participantId === event.killerId) {
              soloKills.push({
                time: frame.timestamp,
                position: event.position
              })
            }

            if (watashi.participantId === event.victimId) {
              soloDeaths.push({
                time: frame.timestamp,
                position: event.position
              })
            }
          }
        })
      }

      gameAnalysis.soloKills = soloKills
      gameAnalysis.soloDeaths = soloDeaths
    }

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
    averageKd: 0,
    kdaCv: 0,

    averageCsShareToTop: 0,
    averageCsShareOfTeam: 0,
    averageCsPerMinute: 0,

    averageGoldShareToTop: 0,
    averageGoldShareOfTeam: 0,

    averageVisionScore: 0,

    averageDamageGoldEfficiency: 0,

    totalKills: 0,
    totalDeaths: 0,
    totalAssists: 0,

    winRate: win / (win + lose),
    win: win,
    lose: lose,

    winningStreak: winningStreak,
    losingStreak: losingStreak,

    count: games.length,

    cherry: {
      count: cherryCount,
      win: cherryWin,
      lose: cherryLost,
      first: cherryFirst,
      winRate: cherryWin / cherryCount,
      top1Rate: cherryFirst / cherryCount
    },

    flashOnD: 0,
    flashOnF: 0,
    sinceLast: Date.now() - detailedGames[0].gameCreation,

    // SGP Only
    averageEnemyMissingPings: 0
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

  let totalCsShareToTop = 0
  let totalCsShareOfTeam = 0
  let totalCsPerMinute = 0

  let totalGoldShareToTop = 0
  let totalGoldShareOfTeam = 0

  let totalVisionScore = 0

  let totalDamageGoldEfficiency = 0

  let totalEnemyMissingPings: number | null = 0

  let positionCount = 0
  const positions: Record<string, number> = {}

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

    summary.totalKills += analysis.kills
    summary.totalDeaths += analysis.deaths
    summary.totalAssists += analysis.assists

    totalCsShareToTop += analysis.csShareToTop
    totalCsShareOfTeam += analysis.csShareOfTeam
    totalCsPerMinute += analysis.csPerMinute

    totalGoldShareToTop += analysis.goldShareToTop
    totalGoldShareOfTeam += analysis.goldShareOfTeam

    totalVisionScore += analysis.visionScore

    totalDamageGoldEfficiency += analysis.damageGoldEfficiency

    if (analysis.position) {
      positionCount++
      positions[analysis.position] = (positions[analysis.position] || 0) + 1
    }

    if (analysis.flashSlot === 'D') {
      summary.flashOnD++
    } else if (analysis.flashSlot === 'F') {
      summary.flashOnF++
    }

    if (analysis.enemyMissingPings === null || totalEnemyMissingPings === null) {
      totalEnemyMissingPings = null
    } else {
      totalEnemyMissingPings += analysis.enemyMissingPings
    }
  }

  // for summary calculation

  summary.kdaCv = calculateCoefficientOfVariation(
    gameAnalyses.map(([_gameId, analysis]) => analysis.kda)
  )

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

  summary.averageKda = (summary.totalKills + summary.totalAssists) / (summary.totalDeaths || 1)
  summary.averageKd = summary.totalKills / (summary.totalDeaths || 1)

  summary.averageCsShareToTop = totalCsShareToTop / (gameAnalyses.length || 1)
  summary.averageCsShareOfTeam = totalCsShareOfTeam / (gameAnalyses.length || 1)
  summary.averageCsPerMinute = totalCsPerMinute / (gameAnalyses.length || 1)

  summary.averageGoldShareToTop = totalGoldShareToTop / (gameAnalyses.length || 1)
  summary.averageGoldShareOfTeam = totalGoldShareOfTeam / (gameAnalyses.length || 1)

  summary.averageVisionScore = totalVisionScore / (gameAnalyses.length || 1)

  summary.averageDamageGoldEfficiency = totalDamageGoldEfficiency / (gameAnalyses.length || 1)

  // SGP Only
  if (totalEnemyMissingPings !== null) {
    summary.averageEnemyMissingPings = totalEnemyMissingPings / (gameAnalyses.length || 1)
  }

  return {
    games: gamesAnalysisMap,
    summary: summary,
    champions: champions,
    positions: {
      total: positionCount,
      positions: {
        TOP: positions.TOP || 0,
        JUNGLE: positions.JUNGLE || 0,
        MIDDLE: positions.MIDDLE || 0,
        BOTTOM: positions.BOTTOM || 0,
        UTILITY: positions.UTILITY || 0
      }
    },
    akariScore: calculateAkariScore({ games: gamesAnalysisMap, summary, champions })
  }
}

export interface MatchHistoryGamesAnalysisTeamSide {
  averageWinRate: number
  averageKda: number
  averageAkariScore: number
  standardizedAkariScoreCv: number
  // balanced strength index
  akariScoreBsi: number
}

export function analyzeTeamMatchHistory(
  analyses: MatchHistoryGamesAnalysisAll[]
): MatchHistoryGamesAnalysisTeamSide | null {
  if (analyses.length === 0) {
    return null
  }

  let totalWinRate = 0
  let totalKills = 0
  let totalDeaths = 0
  let totalAssists = 0
  let totalAkariScore = 0

  for (const analysis of analyses) {
    totalWinRate += analysis.summary.winRate
    totalKills += analysis.summary.totalKills
    totalDeaths += analysis.summary.totalDeaths
    totalAssists += analysis.summary.totalAssists
    totalAkariScore += analysis.akariScore.total
  }

  const sc = calculateCoefficientOfVariation(standardize(analyses.map((a) => a.akariScore.total)))

  return {
    averageWinRate: totalWinRate / analyses.length,
    averageKda: (totalKills + totalAssists) / (totalDeaths || 1),
    averageAkariScore: totalAkariScore / analyses.length,
    standardizedAkariScoreCv: sc,
    akariScoreBsi: totalAkariScore / analyses.length / (1 + sc)
  }
}

export interface AkariScore {
  kdaScore: number
  winRateScore: number
  dmgScore: number
  dmgTakenScore: number
  csScore: number
  goldScore: number
  participationScore: number
  total: number
  good: boolean
  great: boolean
}

// 非卖品, 仅限内部评判使用
export function calculateAkariScore(analyses: {
  games: Record<number, MatchHistoryGamesAnalysis>
  summary: MatchHistoryGamesAnalysisSummary
  champions: Record<number, MatchHistoryChampionAnalysis>
}): AkariScore {
  const kdaScore = Math.sqrt(analyses.summary.averageKda) * 1.44
  const winRateScore = (analyses.summary.winRate - 0.5) * 4
  const dmgScore = analyses.summary.averageDamageDealtToChampionShareToTop * 10.0
  const dmgTakenScore = analyses.summary.averageDamageTakenShareToTop * 8.0
  const csScore =
    analyses.summary.averageCsPerMinute *
    Math.max(Math.min(0.04 * analyses.summary.averageCsPerMinute, 0.4), 0.1)
  const goldScore = analyses.summary.averageGoldShareToTop * 4.0
  const participationScore = analyses.summary.averageKillParticipationRate * 4

  const total =
    kdaScore + winRateScore + dmgScore + dmgTakenScore + csScore + goldScore + participationScore

  return {
    kdaScore,
    winRateScore,
    dmgScore,
    dmgTakenScore,
    csScore,
    goldScore,
    participationScore,
    total,
    good: total >= 26.0,
    great: total >= 30.0
  }
}

export function calculateGameAkariScore(analysis: MatchHistoryGamesAnalysis): AkariScore {
  const kdaScore = Math.sqrt(analysis.kda) * 1.44
  const winRateScore = (analysis.win ? 1 : 0 - 0.5) * 4
  const dmgScore = analysis.damageDealtToChampionShareToTop * 10.0
  const dmgTakenScore = analysis.damageTakenShareToTop * 8.0
  const csScore = analysis.csPerMinute * Math.max(Math.min(0.04 * analysis.csPerMinute, 0.4), 0.1)
  const goldScore = analysis.goldShareToTop * 4.0
  const participationScore = analysis.killParticipationRate * 4

  const total =
    kdaScore + winRateScore + dmgScore + dmgTakenScore + csScore + goldScore + participationScore

  return {
    kdaScore,
    winRateScore,
    dmgScore,
    dmgTakenScore,
    csScore,
    goldScore,
    participationScore,
    total,
    good: total >= 26.0,
    great: total >= 30.0
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0
  }

  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const fraction = index - lower

  if (lower === sorted.length - 1) {
    return sorted[lower]
  }

  return sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower])
}

/**
 * 是找出过高高评分和过低评分的玩家
 */
export function findOutliersByIqr<T>(
  data: T[],
  keyGetter?: (value: T) => number,
  threshold: number = 1.5
): { below: T[]; over: T[] } {
  if (!keyGetter) {
    keyGetter = (value: T) => value as any as number
  }

  const sorted = data.slice().sort((a, b) => keyGetter(a) - keyGetter(b))
  const q1 = percentile(sorted.map(keyGetter), 0.25)
  const q3 = percentile(sorted.map(keyGetter), 0.75)
  const iqr = q3 - q1
  const lowerBound = q1 - threshold * iqr
  const upperBound = q3 + threshold * iqr

  const below: T[] = []
  const over: T[] = []

  for (const d of data) {
    if (keyGetter(d) < lowerBound) {
      below.push(d)
    } else if (keyGetter(d) > upperBound) {
      over.push(d)
    }
  }

  return {
    below,
    over
  }
}

export interface GameRelationship {
  selfPuuid: string
  targetPuuid: string
  targetGameName: string
  targetTagLine: string
  games: {
    gameId: number
    win: boolean
    isOpponent: boolean
    selfChampionId: number
    targetChampionId: number
  }[]
  selfProfileIconId: number
  targetProfileIconId: number
}

/* 分析一页战绩中遇到的玩家，并统计胜负 */
export function analyzeMatchHistoryPlayers(games: MatchHistoryGameWithState[], selfPuuid: string) {
  const relationship: Record<string, GameRelationship> = {}

  for (const game of games) {
    if (!game.isDetailed) {
      continue
    }

    if (game.game.gameType !== 'MATCHED_GAME') {
      continue
    }

    if (isPveQueue(game.game.queueId)) {
      continue
    }

    const participantIdentityMap = game.game.participantIdentities.reduce(
      (acc, p) => {
        acc[p.participantId] = p
        return acc
      },
      {} as Record<number, ParticipantIdentity>
    )

    const selfIdentity = game.game.participantIdentities.find((p) => p.player.puuid === selfPuuid)

    if (!selfIdentity) {
      continue
    }

    const selfParticipant = game.game.participants.find(
      (p) => p.participantId === selfIdentity.participantId
    )

    if (!selfParticipant) {
      continue
    }

    // 斗魂竞技场有 N 个小队
    if (game.game.gameMode === 'CHERRY') {
      const selfSubTeamId = selfParticipant.stats.playerSubteamId

      for (const p of game.game.participants) {
        const identity = participantIdentityMap[p.participantId]

        if (!identity) {
          continue
        }

        if (identity.player.puuid === selfPuuid) {
          continue
        }

        if (!relationship[identity.player.puuid]) {
          relationship[identity.player.puuid] = {
            selfProfileIconId: selfIdentity.player.profileIcon,
            targetProfileIconId: identity.player.profileIcon,
            selfPuuid: selfPuuid,
            targetPuuid: identity.player.puuid,
            targetGameName: identity.player.gameName,
            targetTagLine: identity.player.tagLine,
            games: []
          }
        }

        relationship[identity.player.puuid].games.push({
          gameId: game.game.gameId,
          win: p.stats.win,
          isOpponent: p.stats.playerSubteamId !== selfSubTeamId,
          selfChampionId: selfParticipant.championId,
          targetChampionId: p.championId
        })
      }
    } else {
      for (const p of game.game.participants) {
        const identity = participantIdentityMap[p.participantId]

        if (!identity) {
          continue
        }

        if (identity.player.puuid === selfPuuid) {
          continue
        }

        if (!relationship[identity.player.puuid]) {
          relationship[identity.player.puuid] = {
            selfProfileIconId: selfIdentity.player.profileIcon,
            targetProfileIconId: identity.player.profileIcon,
            selfPuuid: selfPuuid,
            targetPuuid: identity.player.puuid,
            targetGameName: identity.player.gameName,
            targetTagLine: identity.player.tagLine,
            games: []
          }
        }

        relationship[identity.player.puuid].games.push({
          gameId: game.game.gameId,
          win: p.stats.win,
          isOpponent: p.teamId !== selfParticipant.teamId,
          selfChampionId: selfParticipant.championId,
          targetChampionId: p.championId
        })
      }
    }
  }

  return relationship
}

function calculateCoefficientOfVariation(numbers: number[]): number {
  if (!numbers || numbers.length === 0) {
    return -1
  }

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  if (mean === 0) {
    return -1
  }

  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
  const standardDeviation = Math.sqrt(variance)

  return standardDeviation / mean
}

function standardize(numbers: number[]): number[] {
  if (numbers.length === 0) return []

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const range = max - min

  if (range === 0) {
    return new Array(numbers.length).fill(0)
  }

  // 标准化计算
  return numbers.map((num) => (num - min) / range)
}
