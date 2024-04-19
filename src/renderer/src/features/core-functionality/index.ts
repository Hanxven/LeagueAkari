import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { markRaw, watch } from 'vue'

import { LcuHttpError } from '@renderer/http-api/common'
import { getGame, getMatchHistory } from '@renderer/http-api/match-history'
import { getRankedStats } from '@renderer/http-api/ranked'
import { getSummoner } from '@renderer/http-api/summoner'
import { laNotification } from '@renderer/notification'
import { router } from '@renderer/routes'
import { mainCall, mainStateSync, onMainEvent } from '@renderer/utils/ipc'

import { useAppStore } from '../app/store'
import { useGameflowStore } from '../lcu-state-sync/gameflow'
import { useSummonerStore } from '../lcu-state-sync/summoner'
import {
  MatchHistoryGameTabCard,
  OngoingPlayer,
  SummonerTabMatchHistory,
  useCoreFunctionalityStore
} from './store'

export const id = 'feature:core-functionality'

// 核心模块，战绩和对局中信息的自动化处理
export async function setupCoreFunctionality() {
  const cf = useCoreFunctionalityStore()
  const gameflow = useGameflowStore()
  const summoner = useSummonerStore()
  const app = useAppStore()

  onMainEvent('core-functionality/ongoing-player/new', (_, summonerId: number) => {
    cf.ongoingPlayers[summonerId] = {
      summonerId
    }
  })

  onMainEvent(
    'core-functionality/ongoing-player/summoner',
    (_, summonerId: number, info: SummonerInfo) => {
      if (cf.ongoingPlayers[summonerId]) {
        cf.ongoingPlayers[summonerId].summoner = info
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/saved-info',
    (_, summonerId: number, saved: any) => {
      if (cf.ongoingPlayers[summonerId]) {
        cf.ongoingPlayers[summonerId].saved = saved
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/ranked-stats',
    (_, summonerId: number, rankedStats: RankedStats) => {
      if (cf.ongoingPlayers[summonerId]) {
        cf.ongoingPlayers[summonerId].rankedStats = rankedStats
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/match-history',
    (_, summonerId: number, games: Game[]) => {
      if (cf.ongoingPlayers[summonerId]) {
        cf.ongoingPlayers[summonerId].matchHistory = games.map((g) => ({
          isDetailed: false,
          game: markRaw(g)
        }))
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/match-history-detailed-game',
    (_, summonerId: number, game: Game) => {
      if (cf.ongoingPlayers[summonerId]) {
        const mh = cf.ongoingPlayers[summonerId].matchHistory
        if (mh) {
          const thatGame = mh.find((m) => m.game.gameId === game.gameId)
          if (thatGame) {
            thatGame.isDetailed = true
            thatGame.game = markRaw(game)
          }
        }
      }
    }
  )

  mainCall('core-functionality/ongoing-players/get').then((all: Map<number, OngoingPlayer>) => {
    all.forEach((value, key) => {
      cf.ongoingPlayers[key] = value
    })
  })

  mainStateSync('core-functionality/ongoing-state', (s) => (cf.ongoingState = s))
  mainStateSync('core-functionality/ongoing-game-info', (s) => (cf.ongoingGameInfo = s))
  mainStateSync('core-functionality/ongoing-teams', (s) => (cf.ongoingTeams = s))
  mainStateSync('core-functionality/is-in-endgame-phase', (s) => (cf.isInEndgamePhase = s))
  mainStateSync(
    'core-functionality/settings/auto-route-on-game-start',
    (s) => (cf.settings.autoRouteOnGameStart = s)
  )
  mainStateSync(
    'core-functionality/settings/fetch-after-game',
    (s) => (cf.settings.fetchAfterGame = s)
  )
  mainStateSync(
    'core-functionality/settings/fetch-detailed-game',
    (s) => (cf.settings.fetchDetailedGame = s)
  )
  mainStateSync(
    'core-functionality/settings/match-history-load-count',
    (s) => (cf.settings.matchHistoryLoadCount = s)
  )
  mainStateSync(
    'core-functionality/settings/pre-made-team-threshold',
    (s) => (cf.settings.preMadeTeamThreshold = s)
  )
  mainStateSync(
    'core-functionality/settings/send-kda-in-game',
    (s) => (cf.settings.sendKdaInGame = s)
  )
  mainStateSync(
    'core-functionality/settings/send-kda-in-game-with-disclaimer',
    (s) => (cf.settings.sendKdaInGameWithDisclaimer = s)
  )
  mainStateSync(
    'core-functionality/settings/send-kda-in-game-with-pre-made-teams',
    (s) => (cf.settings.sendKdaInGameWithPreMadeTeams = s)
  )
  mainStateSync(
    'core-functionality/settings/send-kda-threshold',
    (s) => (cf.settings.sendKdaThreshold = s)
  )
  mainStateSync(
    'core-functionality/settings/team-analysis-preload-count',
    (s) => (cf.settings.teamAnalysisPreloadCount = s)
  )

  mainStateSync(
    'core-functionality/ongoing-champion-selections',
    (s) => (cf.ongoingChampionSelections = s)
  )

  mainStateSync('core-functionality/ongoing-pre-made-teams', (s) => (cf.ongoingPreMadeTeams = s))

  mainStateSync('core-functionality/send-list', (s) => {
    cf.sendList = s
    console.log(s)
  })

  // 对于自己页面的数据更新
  watch(
    () => summoner.me,
    (summoner) => {
      if (summoner) {
        const tab = cf.getTab(summoner.summonerId)
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
      if (cf.settings.fetchAfterGame && phase === 'EndOfGame') {
        Object.keys(cf.ongoingPlayers).forEach((key) => {
          const id = Number(key)
          if (cf.getTab(id)) {
            fetchTabFullData(id)
          }
        })
      }
    }
  )

  // 自动更换页面
  watch(
    () => cf.ongoingState,
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
    () => summoner.me,
    (val) => {
      if (val) {
        cf.tabs.forEach((t) => cf.setTabPinned(t.id, false))

        if (cf.getTab(val.summonerId)) {
          cf.setTabPinned(val.summonerId, true)
        } else {
          cf.createTab(val.summonerId, { pin: true })
        }
      }
    },
    { immediate: true }
  )

  // 在断开连接后删除所有页面
  watch(
    () => app.lcuConnectionState,
    (s) => {
      if (s === 'disconnected') {
        cf.closeAllTabs()
      }
    }
  )
}

export function setFetchAfterGame(enabled: boolean) {
  return mainCall('core-functionality/settings/fetch-after-game/set', enabled)
}

export function setAutoRouteOnGameStart(enabled: boolean) {
  return mainCall('core-functionality/settings/auto-route-on-game-start/set', enabled)
}

export function setPreMadeThreshold(threshold: number) {
  return mainCall('core-functionality/settings/pre-made-team-threshold/set', threshold)
}

export function setTeamAnalysisPreloadCount(count: number) {
  return mainCall('core-functionality/settings/team-analysis-preload-count/set', count)
}

export function setMatchHistoryLoadCount(count: number) {
  return mainCall('core-functionality/settings/match-history-load-count/set', count)
}

export function setFetchDetailedGame(enabled: boolean) {
  return mainCall('core-functionality/settings/fetch-detailed-game/set', enabled)
}

export function setSendKdaInGame(enabled: boolean) {
  return mainCall('core-functionality/settings/send-kda-in-game/set', enabled)
}

export function setSendKdaThreshold(kda: number) {
  return mainCall('core-functionality/settings/send-kda-threshold/set', kda)
}

export function setSendKdaInGameWithDisclaimer(enabled: boolean) {
  return mainCall('core-functionality/settings/send-kda-in-game-with-disclaimer/set', enabled)
}

export function setSendKdaInGameWithPreMadeTeams(enabled: boolean) {
  return mainCall('core-functionality/settings/send-kda-in-game-with-pre-made-teams/set', enabled)
}

export async function fetchTabRankedStats(summonerId: number) {
  const matchHistory = useCoreFunctionalityStore()

  const tab = matchHistory.getTab(summonerId)
  if (tab && tab.data.summoner) {
    if (tab.data.loading.isLoadingRankedStats) {
      return null
    }

    tab.data.loading.isLoadingRankedStats = true

    try {
      const rankedStats = (await getRankedStats(tab.data.summoner.puuid)).data
      tab.data.rankedStats = markRaw(rankedStats)

      return rankedStats
    } catch (error) {
      laNotification.warn('加载失败', '拉取段位信息失败', error)
    } finally {
      tab.data.loading.isLoadingRankedStats = false
    }
  }

  return null
}

export async function fetchTabSummoner(summonerId: number) {
  const matchHistory = useCoreFunctionalityStore()
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
    } catch (error) {
      laNotification.warn('加载失败', '拉取召唤师信息失败', error)
    } finally {
      tab.data.loading.isLoadingSummoner = false
    }
  }

  return null
}

export async function fetchTabMatchHistory(
  summonerId: number,
  page: number = 1,
  pageSize: number = 20
) {
  const cf = useCoreFunctionalityStore()
  const tab = cf.getTab(summonerId)

  if (tab && tab.data.summoner) {
    if (tab.data.loading.isLoadingMatchHistory) {
      return null
    }

    tab.data.loading.isLoadingMatchHistory = true

    try {
      const matchHistory = (
        await getMatchHistory(tab.data.summoner.puuid, (page - 1) * pageSize, page * pageSize - 1)
      ).data

      tab.data.matchHistory.hasError = false

      tab.data.matchHistory = {
        games: matchHistory.games.games.map((g) => ({
          game: tab.data.detailedGamesCache.get(g.gameId) || markRaw(g),
          isDetailed: tab.data.detailedGamesCache.get(g.gameId) !== undefined,
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
      if (cf.settings.fetchDetailedGame) {
        const tasks = tab.data.matchHistory.games.map(async (g) => {
          try {
            if (g.isDetailed) {
              return
            }

            if (tab.data.detailedGamesCache.has(g.game.gameId)) {
              g.game = tab.data.detailedGamesCache.get(g.game.gameId)!
            } else {
              g.isLoading = true
              const game = (await getGame(g.game.gameId)).data
              g.game = markRaw(game)
              tab.data.detailedGamesCache.set(g.game.gameId, game)
            }

            g.isDetailed = true
          } catch (error) {
            g.hasError = true
            laNotification.warn(
              '加载失败',
              `页面 ${tab.id} - 拉取详细对局 ${g.game.gameId} 失败`,
              error
            )
          } finally {
            g.isLoading = false
          }
        })

        Promise.allSettled(tasks).catch()
      }

      return matchHistory
    } catch (error) {
      tab.data.matchHistory.hasError = true
      if (
        (error as LcuHttpError)?.response?.status === 500 ||
        (error as LcuHttpError)?.response?.status === 503
      ) {
        laNotification.warn(
          '加载失败',
          `拉取战绩失败，服务器异常。远程服务器返回内部错误 ${(error as LcuHttpError)?.response?.status}`,
          error
        )
      } else {
        laNotification.warn('加载失败', '拉取战绩失败', error)
      }
    } finally {
      tab.data.loading.isLoadingMatchHistory = false
    }
  }

  return null
}

export async function fetchTabDetailedGame(summonerId: number, gameId: number) {
  const matchHistory = useCoreFunctionalityStore()
  const tab = matchHistory.getTab(summonerId)

  if (tab) {
    const match = tab.data.matchHistory.gamesMap[gameId]
    if (match) {
      if (match.isLoading || match.isDetailed) {
        return
      }

      if (tab.data.detailedGamesCache.has(gameId)) {
        const game = tab.data.detailedGamesCache.get(gameId)!
        match.game = game
        match.isDetailed = true
        return game
      }

      match.isLoading = true

      try {
        const game = (await getGame(gameId)).data

        tab.data.detailedGamesCache.set(gameId, game)
        match.game = markRaw(game)
        match.isDetailed = true

        return game
      } catch (error) {
        laNotification.warn('加载失败', `拉取详细游戏信息失败`, error)
      } finally {
        match.isLoading = false
      }
    }
  }

  return null
}

export async function fetchTabFullData(summonerId: number) {
  const summoner = await fetchTabSummoner(summonerId)

  if (!summoner) {
    return summonerId
  }

  let failed = false
  await Promise.allSettled([
    (async () => {
      const r = await fetchTabMatchHistory(summonerId)
      if (!r) {
        failed = true
      }
    })(),
    (async () => {
      const r = await fetchTabRankedStats(summonerId)
      if (!r) {
        failed = true
      }
    })()
  ])

  if (failed) {
    return summonerId
  }

  return summoner
}

export function setInGameKdaSendPlayer(summonerId: number, send: boolean) {
  return mainCall('core-functionality/send-list/update', summonerId, send)
}
