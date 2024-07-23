import { LeagueAkariRendererModule } from '@shared/renderer/akari-ipc/renderer-akari-module'
import { getGame, getMatchHistory } from '@shared/renderer/http-api/match-history'
import { getRankedStats } from '@shared/renderer/http-api/ranked'
import { getSummonerByPuuid } from '@shared/renderer/http-api/summoner'
import { useCoreFunctionalityStore } from '@shared/renderer/modules/core-functionality/store'
import { externalDataSourceRendererModule as edsm } from '@shared/renderer/modules/external-data-source'
import { useExternalDataSourceStore } from '@shared/renderer/modules/external-data-source/store'
import { LcuConnectionRendererModule } from '@shared/renderer/modules/lcu-connection'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { useSummonerStore } from '@shared/renderer/modules/lcu-state-sync/summoner'
import { StorageRendererModule } from '@shared/renderer/modules/storage'
import { laNotification } from '@shared/renderer/notification'
import { MatchHistory } from '@shared/types/lcu/match-history'
import { analyzeMatchHistory, analyzeMatchHistoryPlayers } from '@shared/utils/analysis'
import { summonerName } from '@shared/utils/name'
import { AxiosError } from 'axios'
import { computed, markRaw, watch } from 'vue'

import { MatchHistoryGameTabCard, SummonerTabMatchHistory, useMatchHistoryTabsStore } from './store'

/**
 * 仅适用于主窗口战绩页面的渲染端模块
 */
export class MatchHistoryTabsRendererModule extends LeagueAkariRendererModule {
  private _storageModule!: StorageRendererModule

  constructor() {
    super('match-history-tabs', true)
  }

  override async setup() {
    await super.setup()

    this._storageModule = this.manager.getModule('storage')

    this._handleMatchHistoryTabs()
  }

  private _handleMatchHistoryTabs() {
    const cf = useCoreFunctionalityStore()
    const mh = useMatchHistoryTabsStore()
    const gameflow = useGameflowStore()
    const summoner = useSummonerStore()
    const lc = useLcuConnectionStore()

    watch(
      () => summoner.me,
      (summoner) => {
        if (summoner) {
          const tab = mh.getTab(summoner.puuid)
          if (tab) {
            tab.data.summoner = summoner
          }
        }
      }
    )

    const isEndGame = computed(
      () => gameflow.phase === 'EndOfGame' || gameflow.phase === 'PreEndOfGame'
    )

    // 游戏结束更新战绩
    watch(
      () => isEndGame.value,
      (is, _prevP) => {
        if (cf.settings.fetchAfterGame && is) {
          Object.keys(cf.ongoingPlayers).forEach((key) => {
            if (mh.getTab(key)) {
              this.fetchTabFullData(key)
            }
          })
        }
      }
    )

    // 召唤师加载自动创建固定 Tab 页面
    watch(
      () => summoner.me,
      (val) => {
        if (val) {
          mh.tabs.forEach((t) => mh.setTabPinned(t.id, false))

          if (mh.getTab(val.puuid)) {
            mh.setTabPinned(val.puuid, true)
          } else {
            mh.createTab(val.puuid, { pin: true })
            this.fetchTabFullData(val.puuid)
          }
        }
      },
      { immediate: true }
    )

    // 在断开连接后删除所有页面
    watch(
      () => lc.state,
      (s) => {
        if (s === 'disconnected') {
          mh.closeAllTabs()
        }
      }
    )

    // 在切换数据源后清除一些状态
    watch(
      () => cf.settings.matchHistorySource,
      () => {
        mh.tabs.forEach((t) => {
          t.data.matchHistory.queueFilter = -1
        })
      }
    )
  }

  async fetchTabFullData(puuid: string) {
    const lc = useLcuConnectionStore()
    const s = useSummonerStore()
    const summoner = await this.fetchTabSummoner(puuid)

    if (!summoner) {
      throw new Error('Failed to fetch full data')
    }

    let failed = false

    const loadMatchHistoryTask = async () => {
      const r = await this.fetchTabMatchHistory(puuid, 1)
      if (!r) {
        failed = true
      }
    }

    const loadRankedStatsTask = async () => {
      const r = await this.fetchTabRankedStats(puuid)
      if (!r) {
        failed = true
      }
    }

    const loadSavedInfoTask = async () => {
      await this.querySavedInfo(puuid)
    }

    await Promise.allSettled([loadMatchHistoryTask(), loadRankedStatsTask(), loadSavedInfoTask()])

    if (failed) {
      throw new Error('Failed to fetch full data')
    }

    if (lc.auth && s.me) {
      this.saveLocalStorageSearchHistory(
        summonerName(summoner.gameName, summoner.tagLine),
        summoner.puuid,
        lc.auth.region,
        lc.auth.rsoPlatformId,
        s.me.puuid
      )
    }

    return summoner
  }

  async fetchTabDetailedGame(puuid: string, gameId: number) {
    const mh = useMatchHistoryTabsStore()
    const tab = mh.getTab(puuid)

    if (tab) {
      const match = tab.data.matchHistory._gamesMap[gameId]
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

  async querySavedInfo(puuid: string) {
    const summoner = useSummonerStore()
    const mh = useMatchHistoryTabsStore()
    const lc = useLcuConnectionStore()

    if (!lc.auth || !summoner.me) {
      return
    }

    const tab = mh.getTab(puuid)

    if (tab) {
      try {
        const savedInfo = await this._storageModule.querySavedPlayerWithGames({
          selfPuuid: summoner.me.puuid,
          puuid,
          region: lc.auth.region,
          rsoPlatformId: lc.auth.rsoPlatformId
        })

        tab.data.savedInfo = savedInfo
        return savedInfo
      } catch {
        return null
      }
    }

    return null
  }

  async fetchTabRankedStats(puuid: string) {
    const mh = useMatchHistoryTabsStore()

    const tab = mh.getTab(puuid)
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

  async fetchTabSummoner(puuid: string) {
    const mh = useMatchHistoryTabsStore()
    const tab = mh.getTab(puuid)

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

  async fetchTabMatchHistory(
    puuid: string,
    page?: number,
    pageSize?: number,
    queueFilter?: number | string | null
  ) {
    const cf = useCoreFunctionalityStore()
    const mh = useMatchHistoryTabsStore()
    const lc = useLcuConnectionStore()
    const eds = useExternalDataSourceStore()

    const tab = mh.getTab(puuid)

    if (tab && tab.data.summoner) {
      if (tab.data.loading.isLoadingMatchHistory) {
        return null
      }

      tab.data.loading.isLoadingMatchHistory = true

      page = page || tab.data.matchHistory.page || 1
      pageSize = pageSize || tab.data.matchHistory.pageSize || 10
      queueFilter = queueFilter || tab.data.matchHistory.queueFilter || -1

      try {
        const previousExpanded = new Set(
          tab.data.matchHistory.games.filter((g) => g.isExpanded).map((g) => g.game.gameId)
        )

        let matchHistory: MatchHistory
        if (
          cf.settings.matchHistorySource === 'sgp' &&
          eds.sgpAvailability.currentRegionSupported
        ) {
          matchHistory = await edsm.sgp.getMatchHistoryLcuFormat(
            puuid,
            (page - 1) * pageSize,
            pageSize,
            queueFilter === -1 ? undefined : `q_${queueFilter}`
          )

          matchHistory.games.games.forEach((g) => {
            tab.data.detailedGamesCache.set(g.gameId, markRaw(g))
          })
        } else {
          matchHistory = (
            await getMatchHistory(
              tab.data.summoner.puuid,
              (page - 1) * pageSize,
              page * pageSize - 1
            )
          ).data
        }

        const matchHistoryWithState = matchHistory.games.games.map((g) => ({
          game: tab.data.detailedGamesCache.get(g.gameId) || markRaw(g),
          isDetailed: tab.data.detailedGamesCache.get(g.gameId) !== undefined,
          isLoading: false,
          hasError: false,
          isExpanded: previousExpanded.has(g.gameId)
        }))

        const analysis = analyzeMatchHistory(matchHistoryWithState, puuid)
        const playerRelationship = analyzeMatchHistoryPlayers(matchHistoryWithState, puuid)

        tab.data.matchHistory = {
          games: matchHistoryWithState,
          _gamesMap: {},
          page,
          pageSize,
          lastUpdate: Date.now(),
          queueFilter,
          analysis: analysis ? markRaw(analysis) : null,
          playerRelationship: playerRelationship ? markRaw(playerRelationship) : {}
        }

        // 用于快速查找
        tab.data.matchHistory._gamesMap = matchHistoryWithState.reduce(
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

          Promise.allSettled(tasks).catch(() => {})
        }

        return matchHistory
      } catch (error) {
        if (
          (error as AxiosError)?.response?.status === 500 ||
          (error as AxiosError)?.response?.status === 503
        ) {
          laNotification.warn(
            '加载失败',
            `拉取战绩失败，服务器异常。远程服务器返回内部错误 ${(error as AxiosError)?.response?.status}${lc.auth?.rsoPlatformId === 'HN1' ? '，当前服务器为艾欧尼亚，由于服务器原因，特定时间段内无法访问战绩接口。' : ''}`,
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

  /**
   * 基于本地存储
   */
  saveLocalStorageSearchHistory(
    playerName: string,
    puuid: string,
    region: string,
    rsoPlatformId: string,
    selfPuuid: string
  ) {
    const lc = useLcuConnectionStore()
    const s = useSummonerStore()

    if (!lc.auth) {
      return
    }

    if (s.me?.puuid === puuid) {
      return
    }

    const key = `search-history-${selfPuuid}-${region}-${rsoPlatformId || '_'}`
    const str = localStorage.getItem(key) || '[]'

    try {
      const arr = JSON.parse(str)
      const index = arr.findIndex((item: any) => item.puuid === puuid)
      if (index !== -1) {
        arr.splice(index, 1)
      }
      arr.unshift({ playerName, puuid })
      const newArr = arr.slice(0, 10)
      localStorage.setItem(key, JSON.stringify(newArr))
    } catch {
      localStorage.setItem(key, '[]')
    }
  }

  getLocalStorageSearchHistory(
    region: string,
    rsoPlatformId: string,
    selfPuuid: string
  ): { playerName: string; puuid: string }[] {
    const key = `search-history-${selfPuuid}-${region}-${rsoPlatformId || '_'}`
    const str = localStorage.getItem(key) || '[]'

    try {
      return JSON.parse(str)
    } catch {
      return []
    }
  }

  deleteLocalStorageSearchHistory(
    region: string,
    rsoPlatformId: string,
    selfPuuid: string,
    puuid: string
  ) {
    const key = `search-history-${selfPuuid}-${region}-${rsoPlatformId || '_'}`
    const str = localStorage.getItem(key) || '[]'
    try {
      const arr = JSON.parse(str)
      const index = arr.findIndex((item: any) => item.puuid === puuid)
      if (index !== -1) {
        arr.splice(index, 1)
        localStorage.setItem(key, JSON.stringify(arr))
      }
    } catch {
      localStorage.setItem(key, '[]')
    }
  }
}

export const matchHistoryTabsRendererModule = new MatchHistoryTabsRendererModule()
