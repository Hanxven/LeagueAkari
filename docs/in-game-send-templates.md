# 发送模板

用于指导自定义发送时的模板。

## 牛马发送模板

部分实现自：[hh-lol-prophet](https://github.com/real-web-world/hh-lol-prophet)

```
<%
/* 计算方式来自：[hh-lol-prophet](https://github.com/real-web-world/hh-lol-prophet)
 *
 * 目前该评分模板文件仅适用于普通模式, 斗魂竞技场无法使用
 */
%>
<%
// true 或 false, 开启后敌方牛马会变成没有马
const 将敌方牛马转为没有马 = true

// true 或 false, 开启后将展示双方的开黑情况
const 发送开黑信息 = true

const RANKING_SCORE = { 0: 10, 1: 5, 2: 0, 3: -5, 4: -10 }

const NIUMA_NAME = {
  S: '通天代',
  A: '小代',
  B: '上等马',
  C: '中等马',
  D: '下等马',
  E: '牛马',
  F: '没有马'
}

function noZero(n) {
  return n === 0 ? 1 : n
}

function extractGame(puuid, game) {
  const pId = game.participantIdentities.find((p) => p.player.puuid === puuid)?.participantId

  if (!pId) {
    return null
  }

  const participant = game.participants.find((p) => p.participantId === pId)

  if (!participant) {
    return null
  }

  const isFirstBlood = participant.stats.firstBloodKill
  const isFirstBloodAssist = participant.stats.firstBloodAssist
  const triple = participant.stats.tripleKills
  const quadra = participant.stats.quadraKills
  const penta = participant.stats.pentaKills

  const isRecent = Date.now() - game.gameCreation < 5 * 60 * 60 * 1000

  // SGP 有 teamPosition 字段，LCU 没有. 目前的 LCU 字段似乎并不准确
  const isSupport = participant.stats.teamPosition
    ? participant.stats.teamPosition === 'UTILITY'
    : null

  // 参团率计算
  const team = participant.teamId
  const teamParticipants = game.participants.filter((p) => p.teamId === team)

  // 累加求总, 用于后面占比计算
  const totalKills = teamParticipants.reduce((acc, p) => acc + p.stats.kills, 0)
  const totalDmg = teamParticipants.reduce((acc, p) => acc + p.stats.totalDamageDealtToChampions, 0)
  const totalAssists = teamParticipants.reduce((acc, p) => acc + p.stats.assists, 0)

  const sortedByKpr = teamParticipants.toSorted((a, b) => {
    const aKa = a.stats.kills + a.stats.assists
    const bKa = b.stats.kills + b.stats.assists

    if (aKa === bKa) {
      return a.stats.deaths - b.stats.deaths
    }

    return bKa - aKa
  })
  const kprRank = sortedByKpr.findIndex((p) => p.participantId === pId)

  // 经济计算
  const sortedByGr = teamParticipants.toSorted((a, b) => {
    return b.stats.goldEarned - a.stats.goldEarned
  })
  const grRank = sortedByGr.findIndex((p) => p.participantId === pId)

  const sortedByDr = teamParticipants.toSorted((a, b) => {
    return b.stats.totalDamageDealtToChampions - a.stats.totalDamageDealtToChampions
  })
  const drRank = sortedByDr.findIndex((p) => p.participantId === pId)

  const sortedByVr = teamParticipants.toSorted((a, b) => {
    return b.stats.visionScore - a.stats.visionScore
  })
  const vrRank = sortedByVr.findIndex((p) => p.participantId === pId)

  const isKrGt35 = participant.stats.kills / noZero(totalKills) > 0.35
  const isKrGt50 = participant.stats.kills / noZero(totalKills) > 0.5
  const isDrGt35 = participant.stats.totalDamageDealtToChampions / noZero(totalDmg) > 0.35
  const isDrGt50 = participant.stats.totalDamageDealtToChampions / noZero(totalDmg) > 0.5
  const isArGt35 = participant.stats.assists / noZero(totalAssists) > 0.35
  const isAssGt50 = participant.stats.assists / noZero(totalAssists) > 0.5

  const csPerMin =
    (participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled) /
    (game.gameDuration / 60)

  return {
    isFirstBlood,
    isFirstBloodAssist,
    isSupport,
    kprRank,
    grRank,
    drRank,
    vrRank,
    isRecent,
    triple,
    quadra,
    penta,
    isKrGt35,
    isKrGt50,
    isDrGt35,
    isDrGt50,
    isArGt35,
    isAssGt50,
    csPerMin,
    kills: participant.stats.kills,
    assists: participant.stats.assists,
    deaths: participant.stats.deaths,
    memberCount: teamParticipants.length,
    kpr: (participant.stats.kills + participant.stats.assists) / noZero(totalKills),
    kda: (participant.stats.kills + participant.stats.assists) / noZero(participant.stats.deaths)
  }
}

function getTitles() {
  const mh = it.targetMembers
    .map((puuid) => [puuid, it.matchHistory[puuid]])
    .filter(([_, data]) => Boolean(data))

  const players = mh.map(([puuid, m]) => {
    // 仅限正常对局
    const filtered = m.data.filter((g) => !it.utils.isPveQueue(g.queueId))

    const scores = filtered
      .map((p) => {
        const stats = extractGame(puuid, p)

        // 如果无法提取到有效信息, 返回 null, 标记之以过滤
        if (!stats) {
          return null
        }

        let base = 100

        if (stats.isFirstBlood) {
          base += 10
        }

        if (stats.isFirstBloodAssist) {
          base += 5
        }

        if (stats.triple) {
          base += 5
        }

        if (stats.quadra) {
          base += 10
        }

        if (stats.penta) {
          base += 20
        }

        base += RANKING_SCORE[stats.kprRank] || 0

        // 在分路信息的情况下, 这个分数就不计算了
        if (stats.isSupport && stats.grRank <= 1) {
          base += RANKING_SCORE[stats.grRank] || 0
        } else if (stats.isSupport === false /* it may be null */) {
          base += RANKING_SCORE[stats.grRank] || 0
        }

        if (stats.drRank <= 1) {
          base += RANKING_SCORE[stats.drRank] || 0
        }

        if (stats.vrRank <= 1) {
          base += RANKING_SCORE[stats.vrRank] || 0
        }

        if (stats.isKrGt50) {
          if (stats.kills > 15) {
            base += 40
          } else if (stats.kills > 10) {
            base += 20
          } else if (stats.kills > 5) {
            base += 10
          }
        } else if (stats.isKrGt35) {
          if (stats.kills > 15) {
            base += 20
          } else if (stats.kills > 10) {
            base += 10
          } else if (stats.kills > 5) {
            base += 5
          }
        }

        if (stats.isAssGt50) {
          if (stats.assists > 15) {
            base += 40
          } else if (stats.assists > 10) {
            base += 20
          } else if (stats.assists > 5) {
            base += 10
          }
        } else if (stats.isArGt35) {
          if (stats.assists > 15) {
            base += 20
          } else if (stats.assists > 10) {
            base += 10
          } else if (stats.assists > 5) {
            base += 5
          }
        }

        if (stats.isDrGt50) {
          if (stats.kills > 15) {
            base += 40
          } else if (stats.kills > 10) {
            base += 20
          } else if (stats.kills > 5) {
            base += 10
          }
        } else if (stats.isDrGt35) {
          if (stats.kills > 15) {
            base += 20
          } else if (stats.kills > 10) {
            base += 10
          } else if (stats.kills > 5) {
            base += 5
          }
        }

        if (stats.csPerMin >= 10) {
          base += 20
        } else if (stats.csPerMin >= 9) {
          base += 10
        } else if (stats.csPerMin >= 8) {
          base += 5
        }

        base += stats.kda + ((stats.kills - stats.deaths) / noZero(stats.memberCount)) * stats.kpr

        return { base, isRecent: stats.isRecent }
      })
      .filter(Boolean)

    if (scores.length === 0) {
      return { puuid, base: null }
    }

    const recent = scores.filter((s) => s.isRecent)
    const old = scores.filter((s) => !s.isRecent)

    const recentBase = recent.reduce((acc, s) => acc + s.base, 0)
    const oldBase = old.reduce((acc, s) => acc + s.base, 0)

    let finalScore

    // 加权平均时考虑某一方数据为空的情况
    if (recent.length === 0) {
      finalScore = oldBase / old.length
    } else if (old.length === 0) {
      finalScore = recentBase / recent.length
    } else {
      finalScore = (recentBase / recent.length) * 0.8 + (oldBase / old.length) * 0.2
    }

    return {
      puuid,
      base: finalScore
    }
  })

  const one = players.map(({ puuid, base }) => {
    let name
    if (it.queryStage.phase === 'champ-select') {
      name = it.summoner[puuid]?.data.gameName || '未知召唤师'
    } else {
      let selection = it.championSelections[puuid] || -1
      name = it.gameData.champions[selection]?.name || '未知英雄'
    }

    if (base) {
      let 牛马名
      if (base >= 180) {
        牛马名 = NIUMA_NAME.S
      } else if (base >= 150) {
        牛马名 = NIUMA_NAME.A
      } else if (base >= 125) {
        牛马名 = NIUMA_NAME.B
      } else if (base >= 105) {
        牛马名 = NIUMA_NAME.C
      } else if (base >= 95) {
        牛马名 = NIUMA_NAME.D
      } else {
        if (将敌方牛马转为没有马) {
          牛马名 = it.allyMembers.includes(puuid) ? NIUMA_NAME.E : NIUMA_NAME.F
        } else {
          牛马名 = NIUMA_NAME.E
        }
      }

      const {
        averageKda = 0,
        count = 0,
        winRate = 0
      } = it.playerStats.players[puuid]?.summary || {}

      // 事实上，别想在选人阶段发出任何评分，私募腾讯全屏蔽了
      if (it.queryStage.phase === 'champ-select') {
        return `${牛马名} ${name} 评分: ${base.toFixed(0)}，近${count}场KDA ${averageKda.toFixed(1)} 胜率 ${(winRate * 100).toFixed(0)}%`
      } else {
        return `${牛马名} ${name} 评分: ${base.toFixed(1)}，近${count}场KDA ${averageKda.toFixed(2)} 胜率 ${(winRate * 100).toFixed(0)}%`
      }

    } else {
      return `${name} 近期无有效对局`
    }
  })

  if (发送开黑信息) {
    // 在 teams 的哪个里面， teamId: string[]
    const selfTeamId = Object.entries(it.teams).find(([teamId, players]) => {
      return players.includes(it.selfPuuid)
    })?.[0]

    const messages = Object.entries(it.premadeTeams).map(([teamId, groups]) => {
      if (selfTeamId) {
        if (it.target === 'ally') {
          if (teamId !== selfTeamId) {
            return null
          }
        } else if (it.target === 'enemy') {
          if (teamId === selfTeamId) {
            return null
          }
        }
      }

      // 玩家选择转换成英雄名
      const names = groups.map((list) => {
        const names = list.map((puuid) => {
          let selection = it.championSelections[puuid] || -1
          name = it.gameData.champions[selection]?.name || '未知英雄'
          return name
        })

        return names
      })

      if (!names.length) {
        return null
      }

      // 英雄名转换成空格分隔
      const texts = names.map((n) => {
        return n.join(' ')
      })

      let premadeTitle
      if (!selfTeamId) {
        premadeTitle = '开黑'
      } else {
        premadeTitle = teamId === selfTeamId ? '我方开黑' : '敌方开黑'
      }

      return `${premadeTitle} ${texts.map((s) => `[${s}]`).join(' ')}`
    }).filter(Boolean)

    return [...one, ...messages]
  }

  return one
}
%>
<%~ getTitles().join('\n') %>
```
