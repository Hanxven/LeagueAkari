import { appState } from '@main/core/app'
import {
  auxiliaryWindowState,
  closeAuxiliaryWindow,
  createAuxiliaryWindow,
  hideAuxiliaryWindow,
  showAuxiliaryWindow
} from '@main/core/auxiliary-window'
import { lcuConnectionState } from '@main/core/lcu-connection'
import { createLogger } from '@main/core/log'
import { mwNotification } from '@main/core/main-window'
import { pSendKey, pSendKeys, winPlatformEventBus } from '@main/core/platform'
import { getChampSelectSession } from '@main/http-api/champ-select'
import { chatSend } from '@main/http-api/chat'
import { getGameflowSession } from '@main/http-api/gameflow'
import { getGame, getMatchHistory } from '@main/http-api/match-history'
import { getRankedStats } from '@main/http-api/ranked'
import { getSummonerByPuuid } from '@main/http-api/summoner'
import { saveEncounteredGame } from '@main/storage/encountered-games'
import { querySavedPlayerWithGames, saveSavedPlayer } from '@main/storage/saved-player'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall, sendEventToAllRenderer } from '@main/utils/ipc'
import { EMPTY_PUUID } from '@shared/constants'
import { getAnalysis, withSelfParticipantMatchHistory } from '@shared/utils/analysis'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import { calculateTogetherTimes, removeSubsets } from '@shared/utils/team-up-calc'
import { comparer, observable, reaction, runInAction, toJS } from 'mobx'
import PQueue from 'p-queue'

import { chat } from '../lcu-state-sync/chat'
import { gameData } from '../lcu-state-sync/game-data'
import { gameflow } from '../lcu-state-sync/gameflow'
import { summoner } from '../lcu-state-sync/summoner'
import { coreFunctionalityState as cf } from './state'

const fetchMatchHistoryLimiter = new PQueue({
  concurrency: 10
})

const logger = createLogger('core-functionality')

/**
 * League Akari 的核心功能群
 */
export async function setupCoreFunctionality() {
  stateSync()
  ipcCall()
  await loadSettings()

  reaction(
    () => [gameflow.phase, auxiliaryWindowState.isReady] as const,
    ([phase, b]) => {
      if (!b) {
        return
      }

      switch (phase) {
        case 'Matchmaking':
        case 'ReadyCheck':
        case 'ChampSelect':
        case 'Lobby':
          showAuxiliaryWindow()
          return
      }

      hideAuxiliaryWindow()
    },
    { equals: comparer.shallow }
  )

  reaction(
    () => [cf.settings.useAuxiliaryWindow, appState.ready] as const,
    ([enabled, ready]) => {
      if (!ready) {
        return
      }

      if (enabled) {
        createAuxiliaryWindow()
      } else {
        closeAuxiliaryWindow()
      }
    },
    { fireImmediately: true, delay: 500, equals: comparer.shallow }
  )

  reaction(
    () => lcuConnectionState.state,
    (state) => {
      if (state !== 'connected') {
        hideAuxiliaryWindow()
      }
    }
  )

  reaction(
    () => cf.ongoingState,
    async (state) => {
      if (state === 'unavailable') {
        sendEventToAllRenderer('core-functionality/ongoing-player/clear')
        cf.clearOngoingVars()
        return
      }

      try {
        if (state === 'champ-select') {
          await champSelectQuery()
        } else if (state === 'in-game') {
          await inGameQuery()
        }
      } catch (error) {
        mwNotification.warn('core-functionality', '对局中', '无法加载对局中信息')
        logger.warn(`加载对局中信息时发生错误:  ${formatError(error)}, in ${state}`)
      }
    }
  )

  reaction(
    () => cf.ongoingTeams,
    (teams) => {
      if (!teams) {
        return
      }

      for (const [_, players] of Object.entries(teams)) {
        for (const p of players) {
          if (cf.sendList[p] === undefined) {
            cf.sendList[p] = true
          }
        }
      }
    }
  )

  reaction(
    () =>
      [
        Array.from(cf.tempDetailedGames.values()),
        Array.from(cf.ongoingPlayers.values()).map((p) => p.summoner),
        cf.ongoingTeams
      ] as const,
    () => {
      const result = analyzeTeamUp()
      if (result && cf.ongoingState !== 'unavailable') {
        runInAction(() => (cf.ongoingPreMadeTeams = result))
      }
    },
    { delay: 500 }
  )

  // 在游戏结算时记录所有玩家到数据库
  reaction(
    () => gameflow.phase,
    (phase) => {
      if (phase === 'EndOfGame' && gameflow.session && summoner.me && lcuConnectionState.auth) {
        const t1 = gameflow.session.gameData.teamOne
        const t2 = gameflow.session.gameData.teamTwo

        const all = [...t1, ...t2].filter((p) => p.puuid && p.puuid !== summoner.me?.puuid)

        const tasks = all.map(async (p) => {
          const task1 = saveSavedPlayer({
            encountered: true,
            region: lcuConnectionState.auth!.region,
            rsoPlatformId: lcuConnectionState.auth!.rsoPlatformId,
            selfPuuid: summoner.me!.puuid,
            puuid: p.puuid
          })

          const task2 = saveEncounteredGame({
            region: lcuConnectionState.auth!.region,
            rsoPlatformId: lcuConnectionState.auth!.rsoPlatformId,
            selfPuuid: summoner.me!.puuid,
            puuid: p.puuid,
            gameId: gameflow.session!.gameData.gameId
          })

          const r = await Promise.allSettled([task1, task2])
          if (r[0].status === 'fulfilled') {
            logger.info(`保存玩家信息: ${r[0].value.puuid}`)
          } else {
            logger.info(`无法保存玩家信息: ${formatError(r[0].reason)}`)
          }
          if (r[1].status === 'fulfilled') {
            logger.info(`保存游戏历史记录: ${r[1].value.puuid} ${r[1].value.gameId}`)
          } else {
            logger.info(`无法保存游戏历史记录: ${formatError(r[1].reason)}`)
          }
        })

        Promise.allSettled(tasks)
      }
    }
  )

  winPlatformEventBus.on('windows/global-key/page-up', () => {
    sendPlayerStatsInGame('our')
  })

  winPlatformEventBus.on('windows/global-key/page-down', () => {
    sendPlayerStatsInGame('their')
  })

  logger.info('初始化完成')
}

/**
 * team: 'our': 临时的己方队伍; 'their': 临时的对方队伍
 */
async function champSelectQuery() {
  const session = (await getChampSelectSession()).data

  const m = session.myTeam
    .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
    .map((t, i) => ({ puuid: t.puuid, team: 'our', order: i }))

  const t = session.theirTeam
    .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
    .map((t, i) => ({ puuid: t.puuid, team: 'their', order: i }))

  const visiblePlayers = [...m, ...t]

  const playerTasks = visiblePlayers.map((p) => {
    return loadPlayerStats(p.puuid)
  })

  await Promise.all(playerTasks)
}

async function inGameQuery() {
  const session = (await getGameflowSession()).data

  const m = session.gameData.teamOne
    .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
    .map((t, i) => ({ puuid: t.puuid, team: '100', order: i }))

  const t = session.gameData.teamTwo
    .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
    .map((t, i) => ({ puuid: t.puuid, team: '200', order: i }))

  const visiblePlayers = [...m, ...t]

  const playerTasks = visiblePlayers.map((p) => {
    return loadPlayerStats(p.puuid)
  })

  await Promise.all(playerTasks)
}

/**
 * 这将加载目标用户的各类数据，包括：
 *
 * - 召唤师信息
 * - 段位信息
 * - 数据库中已记录的数据
 * - 战绩信息
 */
async function loadPlayerStats(puuid: string) {
  if (!cf.ongoingPlayers.has(puuid)) {
    runInAction(() => cf.ongoingPlayers.set(puuid, observable({ puuid }, {}, { deep: false })))
    sendEventToAllRenderer('core-functionality/ongoing-player/new', puuid)
  }

  const player = cf.ongoingPlayers.get(puuid)!

  // 召唤师信息必须被提前加载完成
  const summonerInfo = (await getSummonerByPuuid(puuid)).data
  runInAction(() => (player.summoner = summonerInfo))

  sendEventToAllRenderer('core-functionality/ongoing-player/summoner', puuid, summonerInfo)

  const auth = lcuConnectionState.auth
  const me = summoner.me

  if (!auth || !me) {
    return
  }

  const _loadSavedInfo = async () => {
    if (player.savedInfo) {
      return
    }

    const savedInfo = await querySavedPlayerWithGames({
      region: auth.region,
      rsoPlatformId: auth.rsoPlatformId,
      selfPuuid: me.puuid,
      puuid: puuid
    })

    if (savedInfo) {
      runInAction(() => (player.savedInfo = savedInfo))

      sendEventToAllRenderer('core-functionality/ongoing-player/saved-info', puuid, savedInfo)
    }
  }

  const _loadRankedStats = async () => {
    if (player.rankedStats) {
      return
    }

    const rankedStats = (await getRankedStats(puuid)).data

    runInAction(() => (player.rankedStats = rankedStats))

    sendEventToAllRenderer('core-functionality/ongoing-player/ranked-stats', puuid, rankedStats)
  }

  const _loadMatchHistory = async () => {
    if (player.matchHistory) {
      return
    }

    const matchHistoryResult = await fetchMatchHistoryLimiter.add(() =>
      getMatchHistory(summonerInfo.puuid, 0, cf.settings.matchHistoryLoadCount - 1)
    )

    if (!matchHistoryResult) {
      return
    }

    runInAction(() => {
      player.matchHistory = matchHistoryResult.data.games.games.map((g) => ({
        game: g,
        isDetailed: false
      }))
    })

    sendEventToAllRenderer(
      'core-functionality/ongoing-player/match-history',
      puuid,
      matchHistoryResult.data.games.games
    )

    const loadGameTasks: Promise<void>[] = []
    const loadCount = Math.min(player.matchHistory!.length, cf.settings.teamAnalysisPreloadCount)
    for (let i = 0; i < loadCount; i++) {
      const game = player.matchHistory![i]

      const _loadGame = async () => {
        if (cf.tempDetailedGames.has(game.game.gameId)) {
          runInAction(() => {
            game.isDetailed = true
            game.game = cf.tempDetailedGames.get(game.game.gameId)!
          })
          return
        }

        try {
          const g = await fetchMatchHistoryLimiter.add(() => getGame(game.game.gameId))

          if (!g) {
            return
          }

          runInAction(() => {
            game.isDetailed = true
            game.game = g.data
            cf.tempDetailedGames.set(g.data.gameId, g.data)
          })

          sendEventToAllRenderer(
            'core-functionality/ongoing-player/match-history-detailed-game',
            puuid,
            g.data
          )
        } catch (error) {
          logger.warn(`无法加载对局, ID: ${game.game.gameId} ${formatError(error)}`)
          // throw error // it will not cause an error
        }
      }

      loadGameTasks.push(_loadGame())
    }

    await Promise.allSettled(loadGameTasks)
  }

  await Promise.allSettled([_loadSavedInfo(), _loadRankedStats(), _loadMatchHistory()])
}

/**
 * 根据给定的对局信息，计算组队情况。这些对局都应该是完整的对局。
 * @param games 完整的对局列表
 * @param ongoingTeams 当前队伍分类
 * @returns 结果
 */
function analyzeTeamUp() {
  if (!cf.ongoingTeams) {
    return null
  }

  const games = Array.from(cf.tempDetailedGames.values())

  if (!games.length) {
    return null
  }

  // 统计所有目前游戏中的每个队伍，并且将这些队伍分别视为一个独立的个体，使用 `${游戏ID}|${队伍ID}` 进行唯一区分
  const teamSides = new Map<string, string[]>()
  for (const game of games) {
    const mode = game.gameMode

    // participantId -> puuid
    const participantsMap = game.participantIdentities.reduce(
      (obj, current) => {
        obj[current.participantId] = current.player.puuid
        return obj
      },
      {} as Record<string, string>
    )

    let grouped: { teamId: number; puuid: string }[]
    if (mode === 'CHERRY') {
      grouped = game.participants.map((p) => ({
        teamId: p.stats.subteamPlacement, // 取值范围是 1, 2, 3, 4, 这个实际上也是最终队伍排名
        puuid: participantsMap[p.participantId]
      }))
    } else {
      // 对于其他模式，按照两队式计算
      grouped = game.participants.map((p) => ({
        teamId: p.teamId,
        puuid: participantsMap[p.participantId]
      }))
    }

    // teamId -> puuid[]，这个记录的是这条战绩中的
    const teamPlayersMap = grouped.reduce(
      (obj, current) => {
        if (obj[current.teamId]) {
          obj[current.teamId].push(current.puuid)
        } else {
          obj[current.teamId] = [current.puuid]
        }
        return obj
      },
      {} as Record<string, string[]>
    )

    // sideId -> puuid[]，按照队伍区分。
    Object.entries(teamPlayersMap).forEach(([teamId, players]) => {
      const sideId = `${game.gameId}|${teamId}`
      if (teamSides.has(sideId)) {
        return
      }
      teamSides.set(sideId, players)
    })
  }

  const matches = Array.from(teamSides).map(([id /* sideId */, players]) => ({ id, players }))

  // result 即为最终计算的组队情况，之后使用 `removeSubsets` 进行进一步化简，移除一些可能不关心的结果
  const result = Object.entries(cf.ongoingTeams).reduce(
    (obj, [team, teamPlayers]) => {
      obj[team] = calculateTogetherTimes(matches, teamPlayers, cf.settings.preMadeTeamThreshold)

      return obj
    },
    {} as Record<
      string,
      {
        players: string[]
        times: number
      }[]
    >
  )

  const teams: { players: string[]; times: number; team: string; _id: number }[] = []

  Object.entries(result).forEach(([team, preMade]) => {
    teams.push(...preMade.map((t, i) => ({ ...t, team, _id: i })))
  })

  // 去除一些不关心的子集，虽然这些子集可能具有更多的共同场次
  return removeSubsets(teams, (team) => team.players)
}

let isSimulatingKeyboard = false
const SEND_INTERVAL = 65

/**
 * 在游戏中或英雄选择中发送这些玩家的数据
 * @param teamSide 发送阵营
 */
async function sendPlayerStatsInGame(teamSide: 'our' | 'their') {
  if (!cf.settings.sendKdaInGame || cf.ongoingState === 'unavailable') {
    return
  }

  if (isSimulatingKeyboard) {
    return
  }

  isSimulatingKeyboard = true

  if (!summoner.me || !cf.ongoingTeams || !cf.ongoingChampionSelections) {
    logger.warn(`信息不足: ${summoner.me} ${cf.ongoingTeams} ${cf.ongoingChampionSelections}`)
    isSimulatingKeyboard = false
    return
  }

  const tasks: (() => Promise<any>)[] = []

  let selfTeam = ''
  for (const [t, players] of Object.entries(cf.ongoingTeams)) {
    if (players.includes(summoner.me.puuid)) {
      selfTeam = t
      break
    }
  }

  if (!selfTeam) {
    isSimulatingKeyboard = false
    return
  }

  const teamsSet: Record<'our' | 'their', Set<string>> = {
    our: new Set(),
    their: new Set()
  }

  for (const [team, players] of Object.entries(cf.ongoingTeams)) {
    if (team === selfTeam) {
      players.forEach((p) => teamsSet.our.add(p))
    } else {
      players.forEach((p) => teamsSet.their.add(p))
    }
  }

  const players = Array.from(cf.ongoingPlayers.values()).filter((p) => {
    if (!p.matchHistory || (!cf.ongoingChampionSelections?.[p.puuid] && !p.summoner)) {
      return false
    }

    if (teamSide === 'our') {
      return teamsSet.our.has(p.puuid)
    } else {
      return teamsSet.their.has(p.puuid)
    }
  })

  if (!players.length) {
    isSimulatingKeyboard = false
    return
  }

  const sendPlayers = players.filter((p) => cf.sendList[p.puuid])

  // 应对英雄重复的情况，一个典型是克隆模式
  const championCountMap = players.reduce(
    (obj, cur) => {
      const playerSelected = cf.ongoingChampionSelections![cur.puuid]

      if (obj[playerSelected]) {
        obj[playerSelected]++
      } else {
        obj[playerSelected] = 1
      }

      return obj
    },
    {} as Record<number, number>
  )

  const texts: string[] = []

  if (sendPlayers.length) {
    const prefixText =
      sendPlayers.length === 1
        ? sendPlayers[0].summoner?.gameName || sendPlayers[0].summoner?.displayName || ''
        : teamSide === 'our'
          ? '我方'
          : '敌方'

    texts.push(`${prefixText}近${cf.settings.matchHistoryLoadCount}场平均KDA：`)
  }

  sendPlayers
    .map((p) => {
      const analysis = getAnalysis(withSelfParticipantMatchHistory(p.matchHistory || [], p.puuid))
      return {
        player: p,
        analysis,
        isEmpty: !p.matchHistory || p.matchHistory.length === 0
      }
    })
    .filter(({ analysis }) => analysis.averageKda >= cf.settings.sendKdaThreshold)
    .map(({ player, analysis, isEmpty }) => {
      let name: string | undefined
      let playerSelected = cf.ongoingChampionSelections![player.puuid]
      if (playerSelected && championCountMap[playerSelected] > 1) {
        name = player.summoner?.gameName || player.summoner?.displayName
      } else {
        name =
          gameData.champions[playerSelected || 0]?.name ||
          player.summoner?.gameName ||
          player.summoner?.displayName
      }

      name = name || player.puuid.slice(0, 4)

      if (isEmpty) {
        return `${name} 近期无有效对局`
      }

      const field1 =
        analysis.winningStreak > 3
          ? ` ${analysis.winningStreak}连胜`
          : analysis.losingStreak > 3
            ? ` ${analysis.losingStreak}连败`
            : ''
      return `${name} 平均KDA ${analysis.averageKda.toFixed(2)} 胜率${analysis.winningRate.toFixed()}${field1}`
    })
    .forEach((t) => texts.push(t))

  if (cf.settings.sendKdaInGameWithPreMadeTeams) {
    const subTeams = cf.ongoingPreMadeTeams.filter((t) => {
      if (teamSide === 'our') {
        return t.team && t.team === selfTeam
      } else {
        return t.team && t.team !== selfTeam
      }
    })

    const teamName = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

    if (subTeams.length) {
      for (let i = 0; i < subTeams.length; i++) {
        const identities = subTeams[i].players.map((p) => {
          return (
            gameData.champions[cf.ongoingChampionSelections![p]]?.name ||
            cf.ongoingPlayers[p]?.summoner?.gameName ||
            cf.ongoingPlayers[p]?.summoner?.displayName ||
            p.toString()
          )
        })

        texts.push(
          `开黑${subTeams.length === 1 ? '' : '小队'}${subTeams.length === 1 ? '' : teamName[i] || i} ${identities.join(' ')}`
        )
      }
    }
  }

  if (!texts.length) {
    isSimulatingKeyboard = false
    return
  }

  if (cf.ongoingState === 'champ-select') {
    if (chat.conversations.championSelect) {
      for (let i = 0; i < texts.length; i++) {
        tasks.push(() => chatSend(chat.conversations.championSelect!.id, texts[i]))

        if (i !== texts.length - 1) {
          tasks.push(() => sleep(SEND_INTERVAL))
        }
      }
    }
  } else if (cf.ongoingState === 'in-game') {
    for (let i = 0; i < texts.length; i++) {
      tasks.push(async () => {
        pSendKey(13, true)
        pSendKey(13, false)
        await sleep(SEND_INTERVAL)
        pSendKeys(texts[i])
        await sleep(SEND_INTERVAL)
        pSendKey(13, true)
        pSendKey(13, false)
      })

      if (i !== texts.length - 1) {
        tasks.push(() => sleep(SEND_INTERVAL))
      }
    }
  }

  for (const task of tasks) {
    if (!isSimulatingKeyboard) {
      return
    }
    await task()
  }

  isSimulatingKeyboard = false
}

function stateSync() {
  ipcStateSync('core-functionality/is-in-endgame-phase', () => cf.isInEndgamePhase)

  ipcStateSync('core-functionality/ongoing-game-info', () => cf.ongoingGameInfo)

  ipcStateSync('core-functionality/ongoing-state', () => cf.ongoingState)

  ipcStateSync('core-functionality/ongoing-champion-selections', () => cf.ongoingChampionSelections)

  ipcStateSync('core-functionality/ongoing-pre-made-teams', () => cf.ongoingPreMadeTeams)

  ipcStateSync('core-functionality/ongoing-teams', () => cf.ongoingTeams)

  ipcStateSync(
    'core-functionality/settings/auto-route-on-game-start',
    () => cf.settings.autoRouteOnGameStart
  )

  ipcStateSync('core-functionality/settings/fetch-after-game', () => cf.settings.fetchAfterGame)

  ipcStateSync(
    'core-functionality/settings/fetch-detailed-game',
    () => cf.settings.fetchDetailedGame
  )

  ipcStateSync(
    'core-functionality/settings/match-history-load-count',
    () => cf.settings.matchHistoryLoadCount
  )

  ipcStateSync(
    'core-functionality/settings/pre-made-team-threshold',
    () => cf.settings.preMadeTeamThreshold
  )

  ipcStateSync('core-functionality/settings/send-kda-in-game', () => cf.settings.sendKdaInGame)

  ipcStateSync(
    'core-functionality/settings/send-kda-in-game-with-pre-made-teams',
    () => cf.settings.sendKdaInGameWithPreMadeTeams
  )

  ipcStateSync('core-functionality/settings/send-kda-threshold', () => cf.settings.sendKdaThreshold)

  ipcStateSync(
    'core-functionality/settings/fetch-match-history-concurrency',
    () => cf.settings.fetchMatchHistoryConcurrency
  )

  ipcStateSync(
    'core-functionality/settings/use-auxiliary-window',
    () => cf.settings.useAuxiliaryWindow
  )

  ipcStateSync(
    'core-functionality/settings/team-analysis-preload-count',
    () => cf.settings.teamAnalysisPreloadCount
  )

  ipcStateSync('core-functionality/send-list', () => toJS(cf.sendList))
}

function ipcCall() {
  // 若渲染进程重新连接时，从主进程中同步此状态
  onRendererCall('core-functionality/ongoing-players/get', (_) => {
    return toJS(cf.ongoingPlayers)
  })

  onRendererCall('core-functionality/send-list/update', (_, puuid, send) => {
    if (cf.sendList[puuid] !== undefined) {
      runInAction(() => (cf.sendList[puuid] = send))
    }
  })

  onRendererCall('core-functionality/settings/auto-route-on-game-start/set', async (_, enabled) => {
    cf.settings.setAutoRouteOnGameStart(enabled)
    await setSetting('core-functionality/auto-route-on-game-start', enabled)
  })

  onRendererCall('core-functionality/settings/fetch-after-game/set', async (_, enabled) => {
    cf.settings.setFetchAfterGame(enabled)
    await setSetting('core-functionality/fetch-after-game', enabled)
  })

  onRendererCall('core-functionality/settings/fetch-detailed-game/set', async (_, enabled) => {
    cf.settings.setFetchDetailedGame(enabled)
    await setSetting('core-functionality/fetch-detailed-game', enabled)
  })

  const setPreMadeTeamThreshold = async (threshold: number) => {
    if (threshold <= 1 || threshold > cf.settings.teamAnalysisPreloadCount) {
      return
    }

    cf.settings.setPreMadeTeamThreshold(threshold)
    await setSetting('core-functionality/pre-made-team-threshold', threshold)
  }

  const setTeamAnalysisPreloadCount = async (count: number) => {
    if (count <= 1 || count < cf.settings.preMadeTeamThreshold) {
      return
    }

    cf.settings.setTeamAnalysisPreloadCount(count)
    await setSetting('core-functionality/team-analysis-preload-count', count)
  }

  onRendererCall('core-functionality/settings/match-history-load-count/set', async (_, count) => {
    if (count <= 1 || count > 200) {
      return
    }

    if (count < cf.settings.preMadeTeamThreshold) {
      await setPreMadeTeamThreshold(count)
    }

    if (count < cf.settings.teamAnalysisPreloadCount) {
      await setTeamAnalysisPreloadCount(count)
    }

    cf.settings.setMatchHistoryLoadCount(count)
    await setSetting('core-functionality/match-history-load-count', count)
  })

  onRendererCall('core-functionality/settings/pre-made-team-threshold/set', (_, threshold) =>
    setPreMadeTeamThreshold(threshold)
  )

  onRendererCall('core-functionality/settings/send-kda-in-game/set', async (_, enabled) => {
    cf.settings.setSendKdaInGame(enabled)
    await setSetting('core-functionality/send-kda-in-game', enabled)
  })

  onRendererCall('core-functionality/settings/team-analysis-preload-count/set', (_, count) =>
    setTeamAnalysisPreloadCount(count)
  )

  onRendererCall(
    'core-functionality/settings/send-kda-in-game-with-pre-made-teams/set',
    async (_, enabled) => {
      cf.settings.setSendKdaInGameWithPreMadeTeams(enabled)
      await setSetting('core-functionality/send-kda-in-game-with-pre-made-teams', enabled)
    }
  )

  onRendererCall('core-functionality/settings/use-auxiliary-window/set', async (_, enabled) => {
    cf.settings.setUseAuxiliaryWindow(enabled)
    await setSetting('core-functionality/use-auxiliary-window', enabled)
  })

  onRendererCall('core-functionality/settings/send-kda-threshold/set', async (_, threshold) => {
    if (threshold < 0) {
      threshold = 0
    }

    cf.settings.setSendKdaThreshold(threshold)
    await setSetting('core-functionality/send-kda-threshold', threshold)
  })

  onRendererCall(
    'core-functionality/settings/fetch-match-history-concurrency/set',
    async (_, limit) => {
      if (limit < 0) {
        limit = 1
      }

      fetchMatchHistoryLimiter.concurrency = limit

      cf.settings.setFetchMatchHistoryConcurrency(limit)
      await setSetting('core-functionality/fetch-match-history-concurrency', limit)
    }
  )

  // 会额外更新现有内容
  onRendererCall('core-functionality/saved-player/save', async (_, player) => {
    const r = await saveSavedPlayer(player)

    if (cf.ongoingPlayers) {
      const p = cf.ongoingPlayers.get(player.puuid)
      if (p) {
        const savedInfo = await querySavedPlayerWithGames({
          region: player.region,
          rsoPlatformId: player.rsoPlatformId,
          selfPuuid: player.selfPuuid,
          puuid: player.puuid
        })

        if (savedInfo) {
          runInAction(() => (p.savedInfo = savedInfo))
          sendEventToAllRenderer(
            'core-functionality/ongoing-player/saved-info',
            player.puuid,
            savedInfo
          )
        }
      }
    }

    return r
  })
}

async function loadSettings() {
  cf.settings.setAutoRouteOnGameStart(
    await getSetting(
      'core-functionality/auto-route-on-game-start',
      cf.settings.autoRouteOnGameStart
    )
  )

  cf.settings.setFetchDetailedGame(
    await getSetting('core-functionality/fetch-detailed-game', cf.settings.fetchDetailedGame)
  )

  cf.settings.setMatchHistoryLoadCount(
    await getSetting(
      'core-functionality/match-history-load-count',
      cf.settings.matchHistoryLoadCount
    )
  )

  cf.settings.setPreMadeTeamThreshold(
    await getSetting('core-functionality/pre-made-team-threshold', cf.settings.preMadeTeamThreshold)
  )

  cf.settings.setSendKdaInGame(
    await getSetting('core-functionality/send-kda-in-game', cf.settings.sendKdaInGame)
  )

  cf.settings.setSendKdaInGameWithPreMadeTeams(
    await getSetting(
      'core-functionality/send-kda-in-game-with-pre-made-teams',
      cf.settings.sendKdaInGameWithPreMadeTeams
    )
  )

  cf.settings.setSendKdaThreshold(
    await getSetting('core-functionality/send-kda-threshold', cf.settings.sendKdaThreshold)
  )

  cf.settings.setTeamAnalysisPreloadCount(
    await getSetting(
      'core-functionality/team-analysis-preload-count',
      cf.settings.teamAnalysisPreloadCount
    )
  )

  cf.settings.setFetchAfterGame(
    await getSetting('core-functionality/fetch-after-game', cf.settings.fetchAfterGame)
  )

  cf.settings.setFetchAfterGame(
    await getSetting('core-functionality/use-auxiliary-window', cf.settings.useAuxiliaryWindow)
  )

  cf.settings.setFetchMatchHistoryConcurrency(
    await getSetting(
      'core-functionality/fetch-match-history-concurrency',
      cf.settings.fetchMatchHistoryConcurrency
    )
  )
}
