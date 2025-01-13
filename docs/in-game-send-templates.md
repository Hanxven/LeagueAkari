# 发送模板

当设置为使用自定义模板时，此脚本文件将指导 League Akari 所发送的内容。

类型定义可参照：`/src/main/shards/in-game-send/env-type.ts`。

::: tip 悬崖勒马
在真正发送之前，可以先使用 `试运行` 查看效果。
:::

---

下述为预定义的模板，您可以根据自己的需求进行修改。复制到设置项位置，并点击 `更新` 即可使用。

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

## 猫咪发送模板

一个评分机制基于 [hh-lol-prophet](https://github.com/real-web-world/hh-lol-prophet) 的变种文案。

```
<%
/**
 * 评分部分实现自：[hh-lol-prophet](https://github.com/real-web-world/hh-lol-prophet)
 */
const RANKING_SCORE = { 0: 10, 1: 5, 2: 0, 3: -5, 4: -10 }

const startText = [
  '喵星传输完成！正在展示峡谷猫咪数据...',
  '喵星通信完成！正在展示最新战绩...',
  '喵星同步完毕！正在展示战斗日志...',
  '已请求到所有喵星数据！即将展示...'
]
const noDataText = '喵星数据库空空如也... 没有找到任何猫咪的战斗记录，看来大家最近都在猫窝里休息！'
const emptyPrefixText = '喵星信号中断...'
const emptyText = [
  '战绩本子空空如也，是不是在偷偷睡懒觉？',
  '没有近期战绩呢，就像一只没捕到老鼠的猫。',
  '数据不够喵，是在猫窝里偷懒吗？'
]
const nekos = {
  S: {
    title: '布偶猫',
    texts: [
      '峡谷王者，堪称完美。',
      '每一爪都精准，队伍的灵魂核心。',
      '稳健与气场并存，胜利离不开你。'
    ]
  },
  A: {
    title: '英国短毛猫',
    texts: [
      '沉稳老练，总能稳住局势。',
      '扎实操作，队伍的可靠后盾。',
      '表现稳健，关键时刻绝不掉链子。'
    ]
  },
  B: {
    title: '橘猫',
    texts: [
      '佛系选手，偶尔也能秀一爪。',
      '表现合格，下次多亮眼些就更好了。',
      '稳扎稳打，虽无惊喜但不拖后腿。'
    ]
  },
  C: {
    title: '土猫',
    texts: [
      '偶有亮点，但失误较多，还需努力。',
      '节奏迷离，潜力尚在。',
      '表现起伏不定，保持稳定更重要。'
    ]
  },
  D: {
    title: '折耳猫',
    texts: [
      '节奏散乱，练练爪子再来！',
      '表现欠佳，但心态可爱值拉满。',
      '操作混乱，但别灰心，下次再战！'
    ]
  },
  E: {
    title: '无毛猫',
    texts: ['风一吹就没了，快稳住！', '表现惨淡，还需苦练。', '节奏全无，但下次还有机会！']
  }
}

// 将 0 视为 1 的小工具函数
function noZero(n) {
  return n === 0 ? 1 : n
}

// 提取某局对当前玩家的统计信息
function extractGame(puuid, game) {
  if (game.endOfGameResult === 'Abort_AntiCheatExit') return null

  const pId = game.participantIdentities.find((p) => p.player.puuid === puuid)?.participantId
  if (!pId) return null

  const participant = game.participants.find((p) => p.participantId === pId)
  if (!participant) return null
  if (participant.stats.gameEndedInEarlySurrender) return null

  const isFirstBlood = participant.stats.firstBloodKill
  const isFirstBloodAssist = participant.stats.firstBloodAssist
  const triple = participant.stats.tripleKills
  const quadra = participant.stats.quadraKills
  const penta = participant.stats.pentaKills

  const isRecent = Date.now() - game.gameCreation < 5 * 60 * 60 * 1000
  const isSupport = participant.stats.teamPosition
    ? participant.stats.teamPosition === 'UTILITY'
    : null

  const team = participant.teamId
  const teamParticipants = game.participants.filter((p) => p.teamId === team)

  const totalKills = teamParticipants.reduce((acc, p) => acc + p.stats.kills, 0)
  const totalDmg = teamParticipants.reduce((acc, p) => acc + p.stats.totalDamageDealtToChampions, 0)
  const totalAssists = teamParticipants.reduce((acc, p) => acc + p.stats.assists, 0)

  const sortedByKpr = teamParticipants.toSorted((a, b) => {
    const aKa = a.stats.kills + a.stats.assists
    const bKa = b.stats.kills + b.stats.assists
    return aKa === bKa ? a.stats.deaths - b.stats.deaths : bKa - aKa
  })
  const kprRank = sortedByKpr.findIndex((p) => p.participantId === pId)

  const sortedByGr = teamParticipants.toSorted((a, b) => b.stats.goldEarned - a.stats.goldEarned)
  const grRank = sortedByGr.findIndex((p) => p.participantId === pId)

  const sortedByDr = teamParticipants.toSorted(
    (a, b) => b.stats.totalDamageDealtToChampions - a.stats.totalDamageDealtToChampions
  )
  const drRank = sortedByDr.findIndex((p) => p.participantId === pId)

  const sortedByVr = teamParticipants.toSorted((a, b) => b.stats.visionScore - a.stats.visionScore)
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
    isWin: participant.stats.win,
    isLose: !participant.stats.win,
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

function getPlayerStats(it) {
  const mh = it.targetMembers
    .map((puuid) => [puuid, it.matchHistory[puuid]])
    .filter(([_, data]) => Boolean(data)) // 有可能玩家无历史数据

  const result = []

  // 逐个玩家计算
  for (const [puuid, m] of mh) {
    const filtered = m.data.filter((g) => !it.utils.isPveQueue(g.queueId))

    const singleGames = []

    for (const game of filtered) {
      const stats = extractGame(puuid, game)
      if (!stats) {
        continue
      }

      let base = 100
      if (stats.isFirstBlood) base += 10
      if (stats.isFirstBloodAssist) base += 5

      if (stats.triple) base += 5
      if (stats.quadra) base += 10
      if (stats.penta) base += 20

      base += RANKING_SCORE[stats.kprRank] || 0

      // 辅助位如果金钱排在队伍前列，加分
      if (stats.isSupport && stats.grRank <= 1) {
        base += RANKING_SCORE[stats.grRank] || 0
      } else if (stats.isSupport === false) {
        base += RANKING_SCORE[stats.grRank] || 0
      }

      if (stats.drRank <= 1) {
        base += RANKING_SCORE[stats.drRank] || 0
      }
      if (stats.vrRank <= 1) {
        base += RANKING_SCORE[stats.vrRank] || 0
      }

      if (stats.isKrGt50) {
        if (stats.kills > 15) base += 40
        else if (stats.kills > 10) base += 20
        else if (stats.kills > 5) base += 10
      } else if (stats.isKrGt35) {
        if (stats.kills > 15) base += 20
        else if (stats.kills > 10) base += 10
        else if (stats.kills > 5) base += 5
      }

      if (stats.isAssGt50) {
        if (stats.assists > 15) base += 40
        else if (stats.assists > 10) base += 20
        else if (stats.assists > 5) base += 10
      } else if (stats.isArGt35) {
        if (stats.assists > 15) base += 20
        else if (stats.assists > 10) base += 10
        else if (stats.assists > 5) base += 5
      }

      if (stats.isDrGt50) {
        if (stats.kills > 15) base += 40
        else if (stats.kills > 10) base += 20
        else if (stats.kills > 5) base += 10
      } else if (stats.isDrGt35) {
        if (stats.kills > 15) base += 20
        else if (stats.kills > 10) base += 10
        else if (stats.kills > 5) base += 5
      }

      if (stats.csPerMin >= 10) {
        base += 20
      } else if (stats.csPerMin >= 9) {
        base += 10
      } else if (stats.csPerMin >= 8) {
        base += 5
      }

      base += stats.kda + ((stats.kills - stats.deaths) / noZero(stats.memberCount)) * stats.kpr

      // 将该对局的统计信息、单局评分等暂存
      singleGames.push({
        base,
        isRecent: stats.isRecent,
        extractedStats: stats
      })
    }

    if (singleGames.length === 0) {
      result.push({
        puuid,
        stats: {
          rating: null,
          gameStats: []
        }
      })
      continue
    }

    // 划分近期 / 非近期对局
    const recent = singleGames.filter((g) => g.isRecent)
    const old = singleGames.filter((g) => !g.isRecent)

    const recentBase = recent.reduce((acc, g) => acc + g.base, 0)
    const oldBase = old.reduce((acc, g) => acc + g.base, 0)

    let finalScore
    if (recent.length === 0) {
      // 没有近期对局，就用老对局的平均
      finalScore = oldBase / old.length
    } else if (old.length === 0) {
      // 没有老对局，就用近期对局的平均
      finalScore = recentBase / recent.length
    } else {
      // 如果近期、老对局都有，近期占比 80%，老对局占比 20%
      finalScore = (recentBase / recent.length) * 0.8 + (oldBase / old.length) * 0.2
    }

    const extractedAll = singleGames.map((g) => g.extractedStats)

    result.push({
      puuid,
      stats: {
        rating: finalScore,
        gameStats: extractedAll
      }
    })
  }

  return result
}

function getRank(score) {
  if (score >= 180) {
    return 'S'
  } else if (score >= 150) {
    return 'A'
  } else if (score >= 125) {
    return 'B'
  } else if (score >= 105) {
    return 'C'
  } else if (score >= 95) {
    return 'D'
  } else {
    return 'E'
  }
}

function generateTextLines() {
  // it 是全局环境的一个对象，包含了所有需要的数据
  const players = getPlayerStats(it)
  const lines = []
  for (const player of players) {
    const summary = it.playerStats?.players?.[player.puuid]?.summary

    const championId = it.championSelections[player.puuid]
    const championName = it.gameData.champions[championId]?.name

    if (player.stats.rating === null || summary === null) {
      lines.push({
        puuid: player.puuid,
        text: `${championName} ${emptyPrefixText} ${emptyText[Math.floor(Math.random() * emptyText.length)]}`
      })
      continue
    }

    const rank = getRank(player.stats.rating)
    const neko = nekos[rank || 'B']

    const part1 = `${neko.title} ${championName} 评分${player.stats.rating.toFixed()}，${neko.texts[Math.floor(Math.random() * neko.texts.length)]}`
    const part2 = []

    if (summary.winningStreak >= 3) {
      part2.push(`${summary.winningStreak} 连胜，`)
    } else if (summary.losingStreak >= 3) {
      part2.push(`${summary.losingStreak} 连败，`)
    }

    part2.push(`胜率 ${(summary.winRate * 100).toFixed()}%，`)
    part2.push(`KDA ${summary.averageKda.toFixed(2)}。`)

    if (player.stats.gameStats.length) {
      if (player.stats.gameStats[0].penta) {
        part2.push('顺便一提，上局拿了五杀！')
      } else if (player.stats.gameStats[0].quadra >= 2) {
        part2.push(`顺便一提，上局拿了${player.stats.gameStats[0].quadra}个四杀！`)
      }
    }

    lines.push({
      puuid: player.puuid,
      text: part1 + part2.join('')
    })
  }

  if (lines.length) {
    lines.unshift({
      puuid: null,
      text: startText[Math.floor(Math.random() * startText.length)]
    })
  } else {
    lines.push({
      puuid: null,
      text: noDataText
    })
  }

  return lines.map((l) => l.text)
}
%>
<%~ generateTextLines().join('\n') %>
```
