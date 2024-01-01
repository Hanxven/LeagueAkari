import { useDebounceFn } from '@vueuse/core'
import PQueue from 'p-queue'
import { computed, markRaw, watch } from 'vue'

import { useStableComputed } from '@renderer/compositions/useStableComputed'
import { notify } from '@renderer/events/notifications'
import { getChampSelectSession } from '@renderer/http-api/champ-select'
import { getGameFlowSession } from '@renderer/http-api/gameflow'
import { getGame, getMatchHistory } from '@renderer/http-api/match-history'
import { getRankedStats } from '@renderer/http-api/ranked'
import { getSummoner } from '@renderer/http-api/summoner'
import { call } from '@renderer/ipc'
import { router } from '@renderer/routes'
import { Participant, isPveQueue } from '@renderer/types/match-history'
import { SummonerInfo } from '@renderer/types/summoner'
import { getSetting, setSetting } from '@renderer/utils/storage'
import { calculateTogetherTimes } from '@renderer/utils/team-up'

import { useLcuStateStore } from './stores/lcu-connection'
import { useChampSelectStore } from './stores/lcu/champ-select'
import { useChatStore } from './stores/lcu/chat'
import { useGameflowStore } from './stores/lcu/gameflow'
import { useSummonerStore } from './stores/lcu/summoner'
import {
  MatchHistoryGame,
  MatchHistoryGameTabCard,
  SavedTaggedPlayer,
  SummonerTabMatchHistory,
  useMatchHistoryStore
} from './stores/match-history'
import { useSettingsStore } from './stores/settings'

export const id = 'feature:match-history'

// 核心模块，战绩和对局中信息的自动化处理
export function setupMatchHistory() {
  const mh = useMatchHistoryStore()
  const chat = useChatStore()
  const settings = useSettingsStore()
  const gameflow = useGameflowStore()
  const summoner = useSummonerStore()
  const lcuState = useLcuStateStore()
  const champSelect = useChampSelectStore()

  loadSettingsFromStorage()

  // 主要用于避免多次判定
  const ongoingState = computed(() => {
    if (lcuState.state !== 'connected') {
      return 'unavailable'
    }

    if (gameflow.phase === 'ChampSelect') {
      return 'champ-select'
    }

    if (
      gameflow.phase === 'GameStart' ||
      gameflow.phase === 'InProgress' ||
      gameflow.phase === 'WaitingForStats' ||
      gameflow.phase === 'PreEndOfGame' ||
      gameflow.phase === 'EndOfGame' ||
      gameflow.phase === 'Reconnect'
    ) {
      return 'in-game'
    }

    return 'unavailable'
  })

  // 只在游戏结束时执行的动作
  const isInEndgamePhase = computed(() => {
    return (
      gameflow.phase === 'WaitingForStats' ||
      gameflow.phase === 'PreEndOfGame' ||
      gameflow.phase === 'EndOfGame'
    )
  })

  // 记录当前游戏中每个阵营有多少的成员
  // 用于记录的临时阵营会发生变化，所以提取逻辑
  const ongoingTeamPlayers = computed(() => {
    return Object.entries(mh.ongoingPlayers).reduce(
      (prev, [summonerId, info]) => {
        if (info.team) {
          if (prev[info.team]) {
            prev[info.team].push(Number(summonerId))
          } else {
            prev[info.team] = [Number(summonerId)]
          }
        }
        return prev
      },
      {} as Record<string, number[]>
    )
  })

  // champ-select 阶段的动态状态变更
  const champSelectionsInChampSelect = useStableComputed(() => {
    if (!champSelect.session) {
      return null
    }

    const selections: Record<number | string, number> = {}
    champSelect.session.myTeam.forEach((p) => {
      if (p.summonerId) {
        selections[p.summonerId] = p.championId || p.championPickIntent
      }
    })

    champSelect.session.theirTeam.forEach((p) => {
      if (p.summonerId) {
        selections[p.summonerId] = p.championId || p.championPickIntent
      }
    })

    return selections
  })

  // 重置一些临时变量
  const clearVars = () => {
    mh.ongoingGame = null
    mh.ongoingPlayers = {}
    mh.ongoingDetailedGamesCache = {}
    mh.ongoingPreMadeTeams = {}
    mh.sendPlayersList = []
  }

  // 加载对局中玩家的各种信息
  const loadPlayerStats = async (
    summonerId: number,
    team?: string,
    order?: number,
    championId?: number
  ) => {
    if (!mh.ongoingPlayers[summonerId]) {
      mh.ongoingPlayers[summonerId] = { id: summonerId }
    }

    if (team !== undefined) {
      mh.ongoingPlayers[summonerId].team = team
    }

    if (order !== undefined) {
      mh.ongoingPlayers[summonerId].order = order = order
    }

    if (championId !== undefined) {
      mh.ongoingPlayers[summonerId].championId = championId
    }

    try {
      let summoner: SummonerInfo
      if (mh.ongoingPlayers[summonerId].summoner) {
        summoner = mh.ongoingPlayers[summonerId].summoner!
      } else {
        summoner = (await getSummoner(summonerId)).data
        if (mh.ongoingPlayers[summonerId]) {
          mh.ongoingPlayers[summonerId].summoner = markRaw(summoner)
        }
      }

      await Promise.all([
        (async () => {
          const savedPlayer = await call<SavedTaggedPlayer>('storage:getTaggedPlayer', summonerId)
          if (
            savedPlayer &&
            mh.ongoingGame &&
            // 避免刷新后判定为新队友，如果相关游戏中有且只有一个，鉴定为刚刚加入
            savedPlayer.relatedGameIds[0] !== mh.ongoingGame.gameId
          ) {
            mh.ongoingPlayers[summonerId].savedInfo = markRaw(savedPlayer)
          }
        })(),
        (async () => {
          if (!mh.ongoingPlayers[summonerId].rankedStats) {
            const rankedStats = (await getRankedStats(summoner.puuid)).data
            if (mh.ongoingPlayers[summonerId]) {
              mh.ongoingPlayers[summonerId].rankedStats = markRaw(rankedStats)
            }
          }
        })(),
        (async () => {
          if (!mh.ongoingPlayers[summonerId].matchHistory) {
            const matchHistory = (
              await getMatchHistory(
                summoner.puuid,
                0,
                settings.matchHistory.matchHistoryLoadCount - 1
              )
            ).data

            if (mh.ongoingPlayers[summonerId]) {
              mh.ongoingPlayers[summonerId].matchHistory = matchHistory.games.games.map((m) => ({
                // 套用了之前数据结构，目前逻辑上不需要 isDetailed 和 isLoading
                isDetailed: false,
                isLoading: false,
                game: markRaw(m)
              }))
            }

            // 加载前几场对局的详细信息，以分析预组队信息
            if (matchHistory.games.games.length >= settings.matchHistory.teamAnalysisPreloadCount) {
              const neededGameIds = matchHistory.games.games
                .slice(0, settings.matchHistory.teamAnalysisPreloadCount)
                .map((m) => m.gameId)

              // 异步分别加载每个详细对局，返回的是非响应式包装后的对象
              ;(async () => {
                try {
                  const tasks = neededGameIds.map((id) =>
                    (async () => {
                      if (mh.ongoingDetailedGamesCache[id]) {
                        return
                      }
                      const game = (await getGame(id)).data
                      mh.ongoingDetailedGamesCache[id] = markRaw(game)
                    })()
                  )

                  // 注意
                  // 这里只是加载到了一个临时 object 中，**仅**用于分析预组队
                  // 并没有并入到战绩列表中，也没有并入到 ongoingPlayers 中
                  // **和战绩页面的数据不互通**
                  await Promise.all(tasks)
                } catch (err) {
                  notify.emit({
                    id,
                    content: `尝试加载前 ${settings.matchHistory.teamAnalysisPreloadCount} 局游戏的详细信息时失败`,
                    silent: true,
                    extra: { error: err }
                  })
                }
              })()
            }
          }
        })()
      ])
    } catch (err) {
      notify.emit({
        id,
        content: '查询玩家信息失败',
        silent: true,
        extra: { error: err }
      })
    }
  }

  // 用于分析预组队的方法，由于计算吃性能，防抖避免短时间内多次计算
  const updatePreMadeTeamAnalysis = useDebounceFn(
    () => {
      if (ongoingState.value === 'unavailable') {
        return
      }

      if (Object.keys(mh.ongoingPlayers).length <= 1) {
        return
      }

      const games = Object.values(mh.ongoingDetailedGamesCache)

      // 统计所有目前游戏中的每个队伍，并且将这些队伍分别视为一个独立的个体，使用 `${游戏ID}|${队伍ID}` 进行唯一区分
      const teamSides = new Map<string, number[]>()
      for (const game of games) {
        const mode = game.gameMode

        // participantId -> summonerId
        const participantsMap = game.participantIdentities.reduce(
          (prev, current) => {
            prev[current.participantId] = current.player.summonerId
            return prev
          },
          {} as Record<string, number>
        )

        let grouped: { teamId: number; summonerId: number }[]
        if (mode === 'CHERRY') {
          grouped = game.participants.map((p) => ({
            teamId: p.stats.subteamPlacement, // 1, 2, 3, 4, 这个实际上是最终队伍结果, just work :)
            summonerId: participantsMap[p.participantId]
          }))
        } else {
          // 对于其他模式，暂且按照普通二队式
          grouped = game.participants.map((p) => ({
            teamId: p.teamId,
            summonerId: participantsMap[p.participantId]
          }))
        }

        // teamId -> summonerId[]，这个记录的是这条战绩中的
        const teamPlayersMap = grouped.reduce(
          (prev, current) => {
            if (prev[current.teamId]) {
              prev[current.teamId].push(current.summonerId)
            } else {
              prev[current.teamId] = [current.summonerId]
            }
            return prev
          },
          {} as Record<string, number[]>
        )

        // sideId -> summonerId[]，按照队伍区分。
        Object.entries(teamPlayersMap).forEach(([teamId, players]) => {
          const sideId = `${game.gameId}|${teamId}`
          if (teamSides.has(sideId)) {
            return
          }
          teamSides.set(sideId, players)
        })
      }

      // 对每个阵营分别计算
      const matches = Array.from(teamSides).map(([id /* sideId */, players]) => ({ id, players }))
      const result = Object.entries(ongoingTeamPlayers.value).reduce(
        (prev, [team, teamPlayers]) => {
          prev[team] = calculateTogetherTimes(
            matches,
            teamPlayers,
            settings.matchHistory.preMadeTeamThreshold
          )

          return prev
        },
        {}
      )

      mh.ongoingPreMadeTeams = markRaw(result)
    },
    500,
    { maxWait: 2000 }
  )

  const savePlayersToStorage = useDebounceFn(
    async () => {
      if (!summoner.currentSummoner || !mh.ongoingPlayers[summoner.currentSummoner.summonerId]) {
        return
      }

      const {
        gameData: { gameId }
      } = (await getGameFlowSession()).data

      // gameId !== 0
      if (!gameId) {
        return
      }

      // 用于分辨对手还是队友，cached
      const selfTeam = mh.ongoingPlayers[summoner.currentSummoner.summonerId].team

      const players: {
        summonerInfo: SummonerInfo
        id: number
        side: string
        relatedGameId: number
      }[] = []

      Object.entries(mh.ongoingPlayers).forEach(([id, info]) => {
        if (!info.team || !info.summoner) {
          return
        }

        if (Number(id) === summoner.currentSummoner?.summonerId) {
          return
        }

        players.push({
          id: Number(id),
          summonerInfo: info.summoner,
          side: info.team === selfTeam ? 'teammate' : 'opponent',
          relatedGameId: gameId
        })
      })

      players.forEach((p) => {
        call('storage:saveTaggedPlayer', p)
      })
    },
    300,
    { maxWait: 1000 }
  )

  const champSelectQuery = async (clear = false) => {
    if (clear) {
      clearVars()
    }

    try {
      const { myTeam, theirTeam } = (await getChampSelectSession()).data

      // 异步加载当前的游戏模式
      ;(async () => {
        const {
          gameData: {
            queue: { type },
            gameId
          }
        } = (await getGameFlowSession()).data

        if (ongoingState.value === 'unavailable') {
          return
        }

        if (mh.ongoingGame) {
          mh.ongoingGame.queueType = type
        } else {
          mh.ongoingGame = { queueType: type, gameId }
        }
      })()

      // 在英雄选择阶段，teamId 使用 100 标记我方，200 标记敌方
      // 有时候是匿名的，所以需要先判断玩家信息是否正确
      // 通常来说，summonerId 为 0 的时候，都是不可见的
      const m = myTeam
        .filter((p) => p.summonerId)
        .map((t, i) => ({ summonerId: t.summonerId, team: 100, order: i }))

      // 在太阳从西边出来的情况下，可以看到对方的召唤师身份信息，万一能呢？
      const t = theirTeam
        .filter((p) => p.summonerId)
        .map((t, i) => ({ summonerId: t.summonerId, team: 200, order: i }))

      await Promise.all([
        [...m, ...t].map(async (o) => loadPlayerStats(o.summonerId, o.team.toString(), o.order))
      ])
    } catch (err) {
      notify.emit({ id, content: '英雄选择中 - 查询玩家信息失败', extra: { error: err } })
    }
  }

  const inGameQuery = async (clear = false) => {
    if (clear) {
      clearVars()
    }

    try {
      const {
        gameData: {
          teamOne,
          teamTwo,
          queue: { type },
          gameId
        }
      } = (await getGameFlowSession()).data

      if (mh.ongoingGame) {
        mh.ongoingGame.queueType = type
        mh.ongoingGame.gameId = gameId
      } else {
        mh.ongoingGame = { queueType: type, gameId }
      }

      // 在游戏进行阶段，根据队列类型，分配 teamId
      // 实际上，难以通过 gameflow 来获取到小队分组，暂时当成一个队伍处理
      // 可以通过 playerSelections 获取分组，但其是按照召唤师 internalName 来区分的，在日后 ID 系统更新之后，缺少测试样例，可能会导致一些问题
      if (type === 'CHERRY') {
        const teamMembers = teamOne
          .filter((p) => p.summonerId)
          .map((t, i) => ({
            summonerId: t.summonerId,
            team: 'all',
            order: i,
            championId: t.championId
          }))

        await Promise.all([
          [...teamMembers].map(async (o) =>
            loadPlayerStats(o.summonerId, o.team, o.order, o.championId)
          )
        ])
      } else {
        const t1 = teamOne
          .filter((p) => p.summonerId)
          .map((t, i) => ({
            summonerId: t.summonerId,
            team: '100',
            order: i,
            championId: t.championId
          }))

        const t2 = teamTwo
          .filter((p) => p.summonerId)
          .map((t, i) => ({
            summonerId: t.summonerId,
            team: '200',
            order: i,
            championId: t.championId
          }))

        await Promise.all([
          [...t1, ...t2].map(async (o) =>
            loadPlayerStats(o.summonerId, o.team, o.order, o.championId)
          )
        ])
      }
    } catch (err) {
      notify.emit({
        id,
        content: '游戏进行中 - 查询玩家信息失败',
        silent: true,
        extra: { error: err }
      })
    }
  }

  // 对于自己页面的数据更新
  watch(
    () => summoner.currentSummoner,
    (summoner) => {
      if (summoner) {
        const tab = mh.getTab(summoner.summonerId)
        if (tab) {
          tab.data.summoner = summoner
        }
      }
    }
  )

  // 游戏结束更新战绩
  watch(
    () => gameflow.phase,
    (phase, _prevP) => {
      if (settings.matchHistory.fetchAfterGame && phase === 'EndOfGame') {
        Object.keys(mh.ongoingPlayers).forEach((key) => {
          const id = Number(key)
          if (mh.getTab(id)) {
            fetchTabFullData(id, true)
          }
        })
      }
    }
  )

  watch(
    () => ongoingState.value,
    (state) => {
      if (state === 'champ-select' || state === 'in-game') {
        if (router.currentRoute.value.name !== 'ongoing-name') {
          router.replace({ name: 'ongoing-game' })
        }
      }
    }
  )

  // 召唤师加载自动创建固定 Tab 页面
  watch(
    () => summoner.currentSummoner,
    (val) => {
      if (val) {
        mh.tabs.forEach((t) => mh.setTabPinned(t.id, false))

        if (mh.getTab(val.summonerId)) {
          mh.setTabPinned(val.summonerId, true)
        } else {
          mh.createTab(val.summonerId, { pin: true })
        }
      }
    },
    { immediate: true }
  )

  // 进入英雄选择或游戏中，自动加载玩家对局信息
  watch(
    () => ongoingState.value,
    async (state) => {
      if (state === 'unavailable') {
        clearVars()
        return
      } else if (state === 'champ-select') {
        await champSelectQuery()
      } else if (state === 'in-game') {
        await inGameQuery()
      }
    },
    { immediate: true }
  )

  watch(
    [() => Object.keys(mh.ongoingDetailedGamesCache).length, () => ongoingTeamPlayers.value],
    ([_, __]) => {
      updatePreMadeTeamAnalysis()
    }
  )

  // 在英雄选择阶段中，更新当前所选英雄的信息
  watch(
    () => champSelectionsInChampSelect.value,
    (selections) => {
      if (selections !== null) {
        Object.entries(selections).forEach(([id, champId]) => {
          if (mh.ongoingPlayers[id]) {
            mh.ongoingPlayers[id].championId = champId
          }
        })
      }
    }
  )

  // 如果不能通过 champ-select 的 session 中获取队友，那么就会尝试通过聊天室加载
  watch(
    () => chat.participants.championSelect,
    (p, prevP) => {
      if (p) {
        const prevS = new Set(prevP || [])
        const added = p.filter((id) => !prevS.has(id))
        for (const id of added) {
          // 在通过聊天室获取玩家信息时，无法获取顺序，因此使用 -1
          console.log('DEBUG: 尝试通过聊天室加入的队友', !!mh.ongoingPlayers[id])
          if (mh.ongoingPlayers[id]) {
            continue
          }

          loadPlayerStats(id, '100')
        }
      }
    }
  )

  // 战后记录用户列表
  watch(
    () => isInEndgamePhase.value,
    async (isInEndgamePhase) => {
      if (isInEndgamePhase) {
        // 访问数据库等
        savePlayersToStorage()
      }
    }
  )
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.matchHistory.fetchAfterGame = getSetting('matchHistory.fetchAfterGame', true)
  settings.matchHistory.maxConcurrency = getSetting('matchHistory.maxConcurrency', 0)
  settings.matchHistory.preMadeTeamThreshold = getSetting('matchHistory.preMadeTeamThreshold', 3)
  settings.matchHistory.teamAnalysisPreloadCount = getSetting(
    'matchHistory.teamAnalysisPreloadCount',
    4
  )
  settings.matchHistory.matchHistoryLoadCount = getSetting('matchHistory.matchHistoryLoadCount', 40)
  settings.matchHistory.autoRouteOnGameStart = getSetting('matchHistory.autoRouteOnGameStart', true)
  settings.matchHistory.fetchDetailedGame = getSetting('matchHistory.fetchDetailedGame', true)
}

export function setAfterGameFetch(enabled: boolean) {
  const settings = useSettingsStore()

  settings.matchHistory.fetchAfterGame = enabled
  setSetting('matchHistory.fetchAfterGame', enabled)
}

export function setAutoRouteOnGameStart(enabled: boolean) {
  const settings = useSettingsStore()

  settings.matchHistory.autoRouteOnGameStart = enabled
  setSetting('matchHistory.autoRouteOnGameStart', enabled)
}

export function setMaxConcurrency(limit: number) {
  if (limit < 0) {
    return
  }

  const settings = useSettingsStore()

  settings.matchHistory.maxConcurrency = limit
  setSetting('matchHistory.maxConcurrency', limit)
}

export function setPreMadeThreshold(threshold: number) {
  const settings = useSettingsStore()

  // 最小阈值不能为 1，并且也不能大于加载数量 (虽然不一定样本不足，但在逻辑上不应该)
  if (threshold <= 1 || threshold > settings.matchHistory.teamAnalysisPreloadCount) {
    return
  }

  settings.matchHistory.preMadeTeamThreshold = threshold
  setSetting('matchHistory.preMadeTeamThreshold', threshold)
}

export function setTeamAnalysisPreloadCount(count: number) {
  const settings = useSettingsStore()

  if (count <= 1 || count < settings.matchHistory.preMadeTeamThreshold) {
    return
  }

  settings.matchHistory.teamAnalysisPreloadCount = count
  setSetting('matchHistory.teamAnalysisPreloadCount', count)
}

export function setMatchHistoryLoadCount(count: number) {
  const settings = useSettingsStore()

  if (count <= 1 || count > 200) {
    return
  }

  if (count < settings.matchHistory.preMadeTeamThreshold) {
    setPreMadeThreshold(count)
  }

  if (count < settings.matchHistory.teamAnalysisPreloadCount) {
    setTeamAnalysisPreloadCount(count)
  }

  settings.matchHistory.matchHistoryLoadCount = count
  setSetting('matchHistory.matchHistoryLoadCount', count)
}

export function setFetchDetailedGame(enabled: boolean) {
  const settings = useSettingsStore()

  settings.matchHistory.fetchDetailedGame = enabled
  setSetting('matchHistory.fetchDetailedGame', enabled)
}

export async function fetchTabRankedStats(summonerId: number) {
  const matchHistory = useMatchHistoryStore()

  const tab = matchHistory.getTab(summonerId)
  if (tab && tab.data.summoner) {
    if (tab.data.loading.isLoadingRankedStats) {
      return
    }

    tab.data.loading.isLoadingRankedStats = true

    try {
      const rankedStats = (await getRankedStats(tab.data.summoner.puuid)).data
      tab.data.rankedStats = markRaw(rankedStats)

      return rankedStats
    } catch (err) {
      notify.emit({ id, type: 'warning', content: '拉取段位信息失败', extra: { error: err } })
    } finally {
      tab.data.loading.isLoadingRankedStats = false
    }
  }

  return null
}

export async function fetchTabSummoner(summonerId: number) {
  const matchHistory = useMatchHistoryStore()
  const tab = matchHistory.getTab(summonerId)

  if (tab) {
    if (tab.data.loading.isLoadingSummoner) {
      return
    }

    tab.data.loading.isLoadingSummoner = true

    try {
      const summoner = (await getSummoner(summonerId)).data
      tab.data.summoner = markRaw(summoner)
      return summoner
    } catch (err) {
      notify.emit({
        id,
        type: 'warning',
        content: '拉取召唤师信息失败',
        extra: { error: err }
      })
    } finally {
      tab.data.loading.isLoadingSummoner = false
    }
  }

  return null
}

function analyzeOnePageMatchHistory(summonerId: number, games: MatchHistoryGame[]) {
  let winningStreak = 0
  let wins = 0
  let isOnAWinningStreak = true
  let kdaSum = 0
  let validGames = 0
  const champMap = new Map<
    number,
    {
      count: number
      win: number
      kda: number
    }
  >()

  for (let i = 0; i < games.length; i++) {
    let self: Participant

    if (!games[i].isDetailed) {
      self = games[i].game.participants[0]
    } else {
      const pId = games[i].game.participantIdentities.find(
        (p) => p.player.summonerId === summonerId
      )!.participantId
      self = games[i].game.participants.find((p) => pId === p.participantId)!
    }

    // 匹配的对局 && 不是人机局 && 不是重开局
    if (
      games[i].game.gameType === 'MATCHED_GAME' &&
      !isPveQueue(games[i].game.queueId) &&
      !self.stats.gameEndedInEarlySurrender
    ) {
      validGames++
    } else {
      continue
    }

    if (!champMap.has(self.championId)) {
      champMap.set(self.championId, {
        count: 0,
        win: 0,
        kda: 0
      })
    }

    const champ = champMap.get(self.championId)!
    champ.count++
    champ.kda += (self.stats.kills + self.stats.assists) / (self.stats.deaths || 1)

    if (self.stats.win) {
      if (isOnAWinningStreak) {
        winningStreak++
      }
      wins++
      champMap.get(self.championId)!.win++
    } else {
      isOnAWinningStreak = false
    }

    kdaSum += (self.stats.kills + self.stats.assists) / (self.stats.deaths || 1)
  }

  for (const [_, info] of champMap) {
    info.kda /= info.count
  }

  const champions = Array.from(champMap)
    .sort((a, b) => {
      return b[1].count === a[1].count ? a[0] - b[0] : b[1].count - a[1].count
    })
    .map((v) => ({
      championId: v[0],
      ...v[1]
    }))

  return {
    winningStreak,
    averageKda: kdaSum / validGames,
    validGames,
    winningRate: (wins / (validGames || 1)) * 100,
    champions
  }
}

export async function fetchTabMatchHistory(
  summonerId: number,
  page: number = 1,
  pageSize: number = 20
) {
  const matchHistory = useMatchHistoryStore()
  const settings = useSettingsStore()
  const tab = matchHistory.getTab(summonerId)

  if (tab && tab.data.summoner) {
    if (tab.data.loading.isLoadingMatchHistory) {
      return
    }

    tab.data.loading.isLoadingMatchHistory = true

    try {
      const matchHistory = (
        await getMatchHistory(tab.data.summoner.puuid, (page - 1) * pageSize, page * pageSize - 1)
      ).data

      tab.data.matchHistory = {
        games: matchHistory.games.games.map((g) => ({
          game: tab.data.detailedGames[g.gameId] || markRaw(g),
          isDetailed: tab.data.detailedGames[g.gameId] !== undefined,
          isLoading: false,
          isExpanded: false
        })),
        gamesMap: {},
        page,
        pageSize,
        lastUpdate: Date.now(),
        isEmpty: matchHistory.games.games.length === 0
      } as SummonerTabMatchHistory

      // 用于快速查找
      tab.data.matchHistory.gamesMap = tab.data.matchHistory.games.reduce(
        (acc, cur) => {
          acc[cur.game.gameId] = cur
          return acc
        },
        {} as Record<number, MatchHistoryGameTabCard>
      )

      // 异步加载页面战绩
      if (settings.matchHistory.fetchDetailedGame) {
        tab.data.matchHistory.games.forEach(async (g) => {
          try {
            if (g.isDetailed) {
              return
            }
            g.isLoading = true
            const game = await getGame(g.game.gameId)
            g.game = game.data
            g.isDetailed = true
          } catch (err) {
            g.hasError = true
            notify.emit({
              id,
              content: `页面 ${tab.id} - 拉取详细对局 ${g.game.gameId} 失败`,
              type: 'warning',
              silent: true
            })
          } finally {
            g.isLoading = false
          }
        })
      }

      // 统计信息
      if (page === 1 && tab.data.matchHistory.games.length > 0) {
        // TODO SOME ANALYSIS
        // 该功能作用不大，暂未实装，在版本后弃用
        const result = analyzeOnePageMatchHistory(tab.id, tab.data.matchHistory.games)
        tab.data.firstPageAnalysis = result
      }

      return matchHistory
    } catch (err) {
      notify.emit({
        id,
        type: 'warning',
        content: '拉取战绩失败',
        extra: { error: err }
      })
    } finally {
      tab.data.loading.isLoadingMatchHistory = false
    }
  }

  return null
}

export async function fetchTabDetailedGame(summonerId: number, gameId: number) {
  const matchHistory = useMatchHistoryStore()
  const tab = matchHistory.getTab(summonerId)

  if (tab) {
    const match = tab.data.matchHistory.gamesMap[gameId]
    if (match) {
      if (match.isLoading || match.isDetailed) {
        return
      }

      if (tab.data.detailedGames[gameId]) {
        match.game = tab.data.detailedGames[gameId]
        match.isDetailed = true
        return tab.data.detailedGames[gameId]
      }

      match.isLoading = true

      try {
        const game = (await getGame(gameId)).data

        const rawGameObj = markRaw(game)
        tab.data.detailedGames[gameId] = rawGameObj
        match.game = rawGameObj
        match.isDetailed = true

        return game
      } catch (err) {
        notify.emit({
          id,
          type: 'warning',
          content: '拉取详细游戏信息失败',
          extra: { error: err }
        })
      } finally {
        match.isLoading = false
      }
    }
  }

  return null
}

export async function fetchTabFullData(summonerId: number, silent = true) {
  const summoner = await fetchTabSummoner(summonerId)

  if (!summoner) {
    return
  }

  const results = await Promise.allSettled([
    fetchTabMatchHistory(summonerId),
    fetchTabRankedStats(summonerId)
  ])

  let failed = false
  results.forEach((r) => {
    if (r.status === 'rejected') {
      notify.emit({
        id,
        type: 'warning',
        content: '拉取数据失败',
        extra: { error: r.reason }
      })
      failed = true
    }
  })

  if (failed) {
    return
  }

  notify.emit({
    id,
    type: 'success',
    silent,
    content: `拉取召唤师 ${summoner.displayName} 的信息成功`
  })
}

// TODO 搁置功能
export function setSendPlayerList(list: number[]) {
  const mh = useMatchHistoryStore()

  mh.sendPlayersList = list
}

export interface SelfParticipantGame extends MatchHistoryGame {
  selfParticipant: Participant
}

export function withSelfParticipantMatchHistory(games: MatchHistoryGame[], selfId: number) {
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

export function getAnalysis(
  matchHistoryList: SelfParticipantGame[],
  sortBy: 'kda' | 'cherry' = 'kda'
) {
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
    maybeWinRateTeam: validGames >= 17 && wins / validGames > 0.94 /* 0.9418 */
  }
}
