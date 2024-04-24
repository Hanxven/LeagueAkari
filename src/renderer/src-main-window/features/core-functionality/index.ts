import { LcuHttpError } from '@shared/renderer-http-api/common'
import { getGame, getMatchHistory } from '@shared/renderer-http-api/match-history'
import { getRankedStats } from '@shared/renderer-http-api/ranked'
import { getSummoner, getSummonerByPuuid } from '@shared/renderer-http-api/summoner'
import { mainCall, mainStateSync, onMainEvent } from '@shared/renderer-utils/ipc'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { markRaw, watch } from 'vue'

import { laNotification } from '@main-window/notification'
import { router } from '@main-window/routes'

import { useAppStore } from '../app/store'
import { useGameflowStore } from '../lcu-state-sync/gameflow'
import { useSummonerStore } from '../lcu-state-sync/summoner'
import {
  MatchHistoryGameTabCard,
  OngoingPlayer,
  SummonerTabMatchHistory,
  useCoreFunctionalityStore
} from './store'

// 核心模块，战绩和对局中信息的自动化处理
export async function setupCoreFunctionality() {
  const cf = useCoreFunctionalityStore()
  const gameflow = useGameflowStore()
  const summoner = useSummonerStore()
  const app = useAppStore()

  onMainEvent('core-functionality/ongoing-player/new', (_, puuid: string) => {
    cf.ongoingPlayers[puuid] = {
      puuid
    }
  })

  onMainEvent(
    'core-functionality/ongoing-player/summoner',
    (_, puuid: string, info: SummonerInfo) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].summoner = info
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/saved-info',
    (_, puuid: string, savedInfo: any) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].savedInfo = savedInfo
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/ranked-stats',
    (_, puuid: string, rankedStats: RankedStats) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].rankedStats = rankedStats
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/match-history',
    (_, puuid: string, games: Game[]) => {
      if (cf.ongoingPlayers[puuid]) {
        cf.ongoingPlayers[puuid].matchHistory = games.map((g) => ({
          isDetailed: false,
          game: markRaw(g)
        }))
      }
    }
  )

  onMainEvent(
    'core-functionality/ongoing-player/match-history-detailed-game',
    (_, puuid: string, game: Game) => {
      if (cf.ongoingPlayers[puuid]) {
        const mh = cf.ongoingPlayers[puuid].matchHistory
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

  onMainEvent('core-functionality/ongoing-player/clear', () => {
    cf.ongoingPlayers = {}
  })

  mainCall('core-functionality/ongoing-players/get').then((all: Map<string, OngoingPlayer>) => {
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

  mainStateSync('core-functionality/send-list', (s) => (cf.sendList = s))

  // 对于自己页面的数据更新
  watch(
    () => summoner.me,
    (summoner) => {
      if (summoner) {
        const tab = cf.getTab(summoner.puuid)
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
          if (cf.getTab(key)) {
            fetchTabFullData(key)
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

        if (cf.getTab(val.puuid)) {
          cf.setTabPinned(val.puuid, true)
        } else {
          cf.createTab(val.puuid, { pin: true })
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

export function setSendKdaInGameWithPreMadeTeams(enabled: boolean) {
  return mainCall('core-functionality/settings/send-kda-in-game-with-pre-made-teams/set', enabled)
}

export async function fetchTabRankedStats(puuid: string) {
  const matchHistory = useCoreFunctionalityStore()

  const tab = matchHistory.getTab(puuid)
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

export async function fetchTabSummoner(puuid: string) {
  const cf = useCoreFunctionalityStore()
  const tab = cf.getTab(puuid)

  if (tab) {
    if (tab.data.loading.isLoadingSummoner) {
      return null
    }

    tab.data.loading.isLoadingSummoner = true

    try {
      const summoner = (await getSummonerByPuuid(puuid)).data
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

export async function fetchTabMatchHistory(puuid: string, page: number = 1, pageSize: number = 20) {
  const cf = useCoreFunctionalityStore()
  const tab = cf.getTab(puuid)
  const app = useAppStore()

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
          `拉取战绩失败，服务器异常。远程服务器返回内部错误 ${(error as LcuHttpError)?.response?.status}${app.lcuAuth?.rsoPlatformId === 'HN1' ? '，特别注意，艾欧尼亚服务器在晚间无法访问战绩接口' : ''}`,
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

export async function fetchTabDetailedGame(puuid: string, gameId: number) {
  const cf = useCoreFunctionalityStore()
  const tab = cf.getTab(puuid)

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

export async function querySavedInfo(puuid: string) {
  const app = useAppStore()
  const summoner = useSummonerStore()
  const cf = useCoreFunctionalityStore()

  if (!app.lcuAuth || !summoner.me) {
    return
  }

  const tab = cf.getTab(puuid)

  if (tab) {
    try {
      const savedInfo = await mainCall('storage/saved-player-with-games/query', {
        selfPuuid: summoner.me.puuid,
        puuid,
        region: app.lcuAuth.region,
        rsoPlatformId: app.lcuAuth.rsoPlatformId
      })

      tab.data.savedInfo = savedInfo
      return savedInfo
    } catch {
      return null
    }
  }

  return null
}

export async function fetchTabFullData(puuid: string) {
  const summoner = await fetchTabSummoner(puuid)

  if (!summoner) {
    return puuid
  }

  let failed = false
  await Promise.allSettled([
    (async () => {
      const r = await fetchTabMatchHistory(puuid)
      if (!r) {
        failed = true
      }
    })(),
    (async () => {
      const r = await fetchTabRankedStats(puuid)
      if (!r) {
        failed = true
      }
    })(),
    (async () => {
      await querySavedInfo(puuid)
    })()
  ])

  if (failed) {
    return puuid
  }

  return summoner
}

export function setInGameKdaSendPlayer(puuid: string, send: boolean) {
  return mainCall('core-functionality/send-list/update', puuid, send)
}
