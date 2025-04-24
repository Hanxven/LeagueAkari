import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol,
  SgpSummoner
} from '@shared/data-sources/sgp/types'
import { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'

export function mapSgpMatchHistoryToLcu0Format(
  sgpMh: SgpMatchHistoryLol,
  start = 0,
  count = 20
): MatchHistory {
  const jsonArr = sgpMh.games.map((game) => mapSgpGameSummaryToLcu0Format(game))

  const gamePage = {
    gameBeginDate: '', // 默认值
    gameCount: count,
    gameEndDate: '', // 默认值
    gameIndexBegin: start,
    gameIndexEnd: start + count - 1,
    games: jsonArr.filter((g) => g !== null) as Game[]
  }

  return {
    accountId: 0, // 默认值
    games: gamePage,
    platformId: '' // 默认值
  }
}

export function mapSgpSummonerToLcu0Format(sgpSummoner: SgpSummoner): SummonerInfo {
  return {
    accountId: sgpSummoner.accountId,
    displayName: sgpSummoner.name,
    gameName: '',
    internalName: sgpSummoner.internalName,
    nameChangeFlag: sgpSummoner.nameChangeFlag,
    percentCompleteForNextLevel: Math.round(
      (sgpSummoner.expPoints / sgpSummoner.expToNextLevel) * 100
    ),
    privacy: sgpSummoner.privacy as 'PUBLIC' | 'PRIVATE' | string, // 强制转换以匹配类型
    profileIconId: sgpSummoner.profileIconId,
    puuid: sgpSummoner.puuid,

    // 默认留空
    rerollPoints: {
      currentPoints: 0,
      maxRolls: 0,
      pointsToReroll: 0,
      numberOfRolls: 0,
      pointsCostToRoll: 0
    },
    tagLine: '',
    summonerId: sgpSummoner.id,
    summonerLevel: sgpSummoner.level,
    unnamed: sgpSummoner.unnamed,
    xpSinceLastLevel: sgpSummoner.expPoints,
    xpUntilNextLevel: sgpSummoner.expToNextLevel - sgpSummoner.expPoints
  }
}

export function mapSgpGameDetailsToLcu0Format(bData: SgpGameDetailsLol): GameTimeline {
  return {
    frames: bData.json.frames.map((frame) => ({
      timestamp: frame.timestamp,
      events: frame.events.map((event) => ({
        // A 的 Event 字段：
        assistingParticipantIds: event.assistingParticipantIds ?? [],
        buildingType: event.buildingType ?? '',
        itemId: event.itemId ?? 0,
        killerId: event.killerId ?? 0,
        laneType: event.laneType ?? '',
        monsterSubType: event.monsterSubType ?? '',
        monsterType: event.monsterType ?? '',
        participantId: event.participantId ?? 0,
        position: event.position ?? { x: 0, y: 0 },
        skillSlot: event.skillSlot ?? 0,
        teamId: event.teamId ?? 0,
        timestamp: event.timestamp,
        towerType: event.towerType ?? '',
        type: event.type ?? '',
        victimId: event.victimId ?? 0
      })),
      participantFrames: Object.fromEntries(
        Object.values(frame.participantFrames).map((pf) => [
          pf.participantId,
          {
            currentGold: pf.currentGold ?? 0,
            dominionScore: 0, // B 中无对应数据，设为默认值
            jungleMinionsKilled: pf.jungleMinionsKilled ?? 0,
            level: pf.level ?? 0,
            minionsKilled: pf.minionsKilled ?? 0,
            participantId: pf.participantId,
            position: pf.position ?? { x: 0, y: 0 },
            teamScore: 0, // B 中无对应数据，设为默认值
            totalGold: pf.totalGold ?? 0,
            xp: pf.xp ?? 0
          }
        ])
      )
    }))
  }
}

export function mapSgpGameSummaryToLcu0Format(game: SgpGameSummaryLol): Game | null {
  // 有些时候没有这个 json 字段, 只有 metadata 字段
  if (!game.json) {
    return null
  }

  const { participants, teams, ...rest } = game.json

  const participantIdentities = participants.map((p) => {
    return {
      participantId: p.participantId,
      player: {
        accountId: 0,
        currentAccountId: 0,
        currentPlatformId: rest.platformId,
        matchHistoryUri: '',
        platformId: rest.platformId,
        profileIcon: p.profileIcon,
        puuid: p.puuid,
        summonerId: p.summonerId,
        summonerName: p.summonerName,
        tagLine: p.riotIdTagline,
        gameName: p.riotIdGameName
      }
    }
  })

  const p2s = participants.map((p) => {
    const perkInfo: {
      perkPrimaryStyle: number
      perkSubStyle: number
      perk0: number
      perk0Var1: number
      perk0Var2: number
      perk0Var3: number
      perk1: number
      perk1Var1: number
      perk1Var2: number
      perk1Var3: number
      perk2: number
      perk2Var1: number
      perk2Var2: number
      perk2Var3: number
      perk3: number
      perk3Var1: number
      perk3Var2: number
      perk3Var3: number
      perk4: number
      perk4Var1: number
      perk4Var2: number
      perk4Var3: number
      perk5: number
      perk5Var1: number
      perk5Var2: number
      perk5Var3: number
    } = {} as any

    p.perks.styles.forEach((style) => {
      if (style.description === 'primaryStyle') {
        perkInfo.perkPrimaryStyle = style.style
      } else if (style.description === 'subStyle') {
        perkInfo.perkSubStyle = style.style
      }
    })

    let perkIndex = 0
    p.perks.styles
      .map((v) => v.selections)
      .forEach((selections) => {
        selections.forEach((selection) => {
          const key = `perk${perkIndex++}`
          perkInfo[key] = selection.perk

          perkInfo[`${key}Var1`] = selection.var1
          perkInfo[`${key}Var2`] = selection.var2
          perkInfo[`${key}Var3`] = selection.var3
        })
      })

    return {
      championId: p.championId,
      highestAchievedSeasonTier: '',
      participantId: p.participantId,
      spell1Id: p.spell1Id,
      spell2Id: p.spell2Id,
      teamId: p.teamId,
      stats: {
        earlySurrenderAccomplice: false,
        causedEarlySurrender: false,
        firstInhibitorAssist: false, // 默认值
        firstInhibitorKill: false, // 默认值
        combatPlayerScore: 0, // 默认值
        playerScore0: 0, // 默认值
        playerScore1: 0, // 默认值
        playerScore2: 0, // 默认值
        playerScore3: 0, // 默认值
        playerScore4: 0, // 默认值
        playerScore5: 0, // 默认值
        playerScore6: 0, // 默认值
        playerScore7: 0, // 默认值
        playerScore8: 0, // 默认值
        playerScore9: 0, // 默认值
        totalPlayerScore: 0, // 默认值
        totalScoreRank: 0, // 默认值
        objectivePlayerScore: 0, // 默认值
        magicalDamageTaken: p.magicDamageTaken,
        neutralMinionsKilledEnemyJungle: p.totalEnemyJungleMinionsKilled,
        neutralMinionsKilledTeamJungle: p.totalAllyJungleMinionsKilled,
        totalTimeCrowdControlDealt: p.totalTimeCCDealt,
        ...perkInfo,
        ...p
      },
      timeline: {
        creepsPerMinDeltas: {},
        csDiffPerMinDeltas: {},
        damageTakenDiffPerMinDeltas: {},
        damageTakenPerMinDeltas: {},
        goldPerMinDeltas: {},
        lane: p.lane,
        participantId: p.participantId,
        role: p.role,
        xpDiffPerMinDeltas: {},
        xpPerMinDeltas: {}
      }
    }
  })

  // first blood teamId
  const firstBloodTeamId = participants.find((p) => p.firstBloodKill)?.teamId

  const t2s = teams.map((t) => {
    const { win, objectives, bans, teamId } = t

    return {
      teamId,
      bans,
      baronKills: objectives.baron?.kills || 0,
      dragonKills: objectives.dragon?.kills || 0,
      firstBaron: objectives.baron?.first || false,
      firstBlood: firstBloodTeamId === t.teamId,
      firstDargon: objectives.dragon?.first || false, // LCU 接口中的 Dragon 拼写就是如此，不确定是否是有意为之
      firstInhibitor: objectives.inhibitor?.first || false,
      firstTower: objectives.tower?.first || false,
      hordeKills: objectives.horde?.kills || 0,
      inhibitorKills: objectives.inhibitor?.kills || 0,
      riftHeraldKills: objectives.riftHerald?.kills || 0,
      vilemawKills: 0, // 默认值
      dominionVictoryScore: 0, // 默认值
      towerKills: objectives.tower?.kills || 0,
      win: win ? 'Win' : 'Fail'
    }
  })

  return {
    ...rest,
    gameCreationDate: new Date(rest.gameCreation).toISOString(),
    participantIdentities,
    participants: p2s,
    teams: t2s
  }
}
