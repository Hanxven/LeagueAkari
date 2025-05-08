/**
 * 默认模板
 * @returns {string[]}
 */
function getMessages(env) {
  if (!env.playerStats) return []

  const puuids = env.targetMembers
  const items = puuids
    .map((puuid) => {
      let name
      if (env.queryStage.phase === 'champ-select') {
        name = env.summoner[puuid]?.data.gameName || '未知召唤师'
      } else {
        let selection = env.championSelections[puuid] || -1
        name = env.gameData.champions[selection]?.name || '未知英雄'
      }

      const {
        averageKda = 0,
        count = 0,
        winRate = 0
      } = env.playerStats.players[puuid]?.summary || {}
      return { puuid, name, averageKda, count, winRate }
    })
    .map(
      ({ name, averageKda, count, winRate }) =>
        `${name}：近${count}场KDA ${averageKda.toFixed(2)} 胜率 ${(winRate * 100).toFixed(0)}%`
    )

  return items
}

function getMetadata() {
  return {
    version: 10
  }
}
