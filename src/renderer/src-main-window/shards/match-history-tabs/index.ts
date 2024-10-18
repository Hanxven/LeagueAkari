import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { EMPTY_PUUID } from '@shared/constants/common'
import { computed, effectScope, markRaw, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useMatchHistoryTabsStore } from './store'

/**
 * 仅适用于主窗口战绩页面的渲染端模块
 */
export class MatchHistoryTabsRenderer implements IAkariShardInitDispose {
  static id = 'match-history-tabs-renderer'
  static dependencies = ['setting-utils-renderer', 'sgp-renderer']

  private readonly _setting: SettingUtilsRenderer
  private readonly _scope = effectScope()

  constructor(deps: any) {
    this._setting = deps['setting-utils-renderer']
  }

  async onInit() {
    this._scope.run(() => {
      this._handleSettings()
      this._handleMatchHistoryTabs()
    })
  }

  async onDispose() {
    this._scope.stop()
  }

  private _handleMatchHistoryTabs() {
    const ogs = useOngoingGameStore()
    const mhs = useMatchHistoryTabsStore()
    const lcs = useLeagueClientStore()
    const sgps = useSgpStore()

    watch(
      () => lcs.summoner.me,
      (summoner) => {
        if (summoner) {
          const tab = mhs.getTabByPuuid(summoner.puuid)
          if (tab) {
            tab.summoner = markRaw(summoner)
          }
        }
      }
    )

    const isEndGame = computed(
      () => lcs.gameflow.phase === 'EndOfGame' || lcs.gameflow.phase === 'PreEndOfGame'
    )

    // 游戏结束更新战绩
    watch(
      () => isEndGame.value,
      (is, _prevP) => {
        if (mhs.settings.refreshTabsAfterGameEnds && is) {
          const allPlayerPuuids = Object.values(ogs.teams || {}).flat()

          for (const tab of mhs.tabs) {
            if (allPlayerPuuids.includes(tab.puuid)) {
              // TODO DEBUG 刷新战绩
              // this.fetchTabMatchHistory(this.toUnionId(tab.data.sgpServerId, tab.data.puuid))
            }
          }
        }
      }
    )

    // 当前召唤师登录时，立即创建一个页面
    watch(
      [() => lcs.summoner.me, () => sgps.availability.sgpServerId],
      ([me, sgpServerId]) => {
        if (me) {
          this.createTab(me.puuid, sgpServerId)
        }
      },
      { immediate: true }
    )

    // 在断开连接后删除所有页面
    watch(
      () => lcs.connectionState,
      (s) => {
        if (s === 'disconnected') {
          mhs.closeAllTabs()
        }
      }
    )

    // 在切换数据源后清除一些状态
    watch(
      () => mhs.settings.matchHistoryUseSgpApi,
      (y) => {
        if (!y) {
          mhs.tabs.forEach((t) => {
            if (t.matchHistoryPage) {
              t.matchHistoryPage.tag = 'all'
            }
          })
        }
      }
    )
  }

  private _isCrossRegion(targetSgpServerId: string) {
    const sgps = useSgpStore()

    return sgps.availability.sgpServerId !== targetSgpServerId
  }

  // async fetchTabFullData(unionId: string) {
  //   const lc = useLcuConnectionStore()
  //   const self = useSummonerStore()
  //   const mh = useMatchHistoryTabsStore()

  //   const loadSummoner = async () => {
  //     await this.fetchTabSummoner(unionId)
  //   }

  //   const loadMatchHistoryTask = async () => {
  //     await this.fetchTabMatchHistory(unionId, 1)
  //   }

  //   const loadRankedStatsTask = async () => {
  //     await this.fetchTabRankedStats(unionId)
  //   }

  //   const loadSavedInfoTask = async () => {
  //     await this.querySavedInfo(unionId)
  //   }

  //   const [summonerR, matchHistoryR, rankedStatsR, savedInfoR] = await Promise.allSettled([
  //     loadSummoner(),
  //     loadMatchHistoryTask(),
  //     loadRankedStatsTask(),
  //     loadSavedInfoTask()
  //   ])

  //   if (summonerR.status === 'fulfilled') {
  //     const tab = mh.getTab(unionId)
  //     if (
  //       lc.auth &&
  //       self.me &&
  //       tab &&
  //       tab.data.summoner &&
  //       !this._isCrossRegion(tab.data.sgpServerId) // 暂时不会记录跨区玩家
  //     ) {
  //       this.saveLocalStorageSearchHistory(
  //         summonerName(tab.data.summoner.gameName, tab.data.summoner.tagLine),
  //         tab.data.summoner.puuid,
  //         lc.auth.region,
  //         lc.auth.rsoPlatformId,
  //         self.me.puuid
  //       )
  //     }
  //   } else {
  //     throw summonerR.reason
  //   }

  //   if (matchHistoryR.status === 'rejected') {
  //     throw matchHistoryR.reason
  //   }

  //   if (rankedStatsR.status === 'rejected') {
  //     throw rankedStatsR.reason
  //   }

  //   if (savedInfoR.status === 'rejected') {
  //     throw savedInfoR.reason
  //   }
  // }

  // async fetchTabDetailedGame(puuid: string, gameId: number) {
  //   const mh = useMatchHistoryTabsStore()
  //   const tab = mh.getTab(puuid)

  //   if (tab) {
  //     const match = tab.data.matchHistoryPage._gamesMap[gameId]
  //     if (match) {
  //       if (match.isLoading || match.isDetailed) {
  //         return
  //       }

  //       if (tab.data.detailedGamesCache.has(gameId)) {
  //         const game = tab.data.detailedGamesCache.get(gameId)!
  //         match.game = game
  //         match.isDetailed = true
  //         return game
  //       }

  //       match.isLoading = true

  //       try {
  //         const game = (await getGame(gameId)).data

  //         tab.data.detailedGamesCache.set(gameId, game)
  //         match.game = markRaw(game)
  //         match.isDetailed = true

  //         return game
  //       } catch (error) {
  //         laNotification.warn('加载失败', `拉取详细游戏信息失败`, error)
  //       } finally {
  //         match.isLoading = false
  //       }
  //     }
  //   }

  //   return null
  // }

  // async querySavedInfo(unionId: string) {
  //   const summoner = useSummonerStore()
  //   const mh = useMatchHistoryTabsStore()
  //   const lc = useLcuConnectionStore()

  //   if (!lc.auth || !summoner.me) {
  //     return
  //   }

  //   const tab = mh.getTab(unionId)

  //   const { puuid } = this.parseUnionId(unionId)

  //   if (tab) {
  //     try {
  //       const savedInfo = await this._storageModule.querySavedPlayerWithGames({
  //         selfPuuid: summoner.me.puuid,
  //         puuid,
  //         region: lc.auth.region,
  //         rsoPlatformId: lc.auth.rsoPlatformId
  //       })

  //       tab.data.savedInfo = savedInfo
  //       return savedInfo
  //     } catch {
  //       return null
  //     }
  //   }

  //   return null
  // }

  // async fetchTabRankedStats(unionId: string) {
  //   const mh = useMatchHistoryTabsStore()

  //   const { puuid, sgpServerId } = this.parseUnionId(unionId)

  //   if (this._isCrossRegion(sgpServerId)) {
  //     return
  //   }

  //   const tab = mh.getTab(unionId)
  //   if (tab) {
  //     if (tab.data.loading.isLoadingRankedStats) {
  //       return
  //     }

  //     tab.data.loading.isLoadingRankedStats = true

  //     try {
  //       const rankedStats = (await getRankedStats(puuid)).data
  //       tab.data.rankedStats = markRaw(rankedStats)
  //     } catch (error) {
  //       laNotification.warn('加载失败', '拉取段位信息失败', error)
  //       throw error
  //     } finally {
  //       tab.data.loading.isLoadingRankedStats = false
  //     }
  //   }
  // }

  // async fetchTabSummoner(unionId: string) {
  //   const mh = useMatchHistoryTabsStore()
  //   const eds = useExternalDataSourceStore()
  //   const tab = mh.getTab(unionId)

  //   const { puuid, sgpServerId } = this.parseUnionId(unionId)

  //   if (tab) {
  //     if (tab.data.loading.isLoadingSummoner) {
  //       return
  //     }

  //     tab.data.loading.isLoadingSummoner = true

  //     try {
  //       if (this._isCrossRegion(sgpServerId)) {
  //         if (!eds.sgpAvailability.sgpServers.servers[sgpServerId].common) {
  //           throw new Error('Unsupported sgp server')
  //         }

  //         const summoner = await edsm.sgp.getSummonerLcuFormat(puuid, sgpServerId)

  //         const ns = await getPlayerAccountNameset(puuid)
  //         summoner.gameName = ns.gnt.gameName
  //         summoner.tagLine = ns.gnt.tagLine

  //         tab.data.summoner = markRaw(summoner)
  //       } else {
  //         const summoner = (await getSummonerByPuuid(puuid)).data
  //         tab.data.summoner = markRaw(summoner)
  //       }
  //     } catch (error) {
  //       laNotification.warn('加载失败', '拉取召唤师信息失败', error)
  //       throw error
  //     } finally {
  //       tab.data.loading.isLoadingSummoner = false
  //     }
  //   }
  // }

  // async fetchTabMatchHistory(
  //   unionId: string,
  //   page?: number,
  //   pageSize?: number,
  //   queueFilter?: number | string | null
  // ) {
  //   const cf = useCoreFunctionalityStore()
  //   const mh = useMatchHistoryTabsStore()
  //   const lc = useLcuConnectionStore()
  //   const eds = useExternalDataSourceStore()

  //   const tab = mh.getTab(unionId)

  //   const { puuid, sgpServerId } = this.parseUnionId(unionId)

  //   if (tab) {
  //     if (tab.data.loading.isLoadingMatchHistory) {
  //       return
  //     }

  //     tab.data.loading.isLoadingMatchHistory = true

  //     page = page || tab.data.matchHistoryPage.page || 1
  //     pageSize = pageSize || tab.data.matchHistoryPage.pageSize || 10
  //     queueFilter = queueFilter || tab.data.matchHistoryPage.queueFilter || -1

  //     try {
  //       const previousExpanded = new Set(
  //         tab.data.matchHistoryPage.games.filter((g) => g.isExpanded).map((g) => g.game.gameId)
  //       )

  //       let matchHistory: MatchHistory
  //       let matchHistorySource: 'sgp' | 'lcu' = 'lcu'
  //       if (this._isCrossRegion(sgpServerId)) {
  //         if (!eds.sgpAvailability.sgpServers.servers[sgpServerId]) {
  //           throw new Error('Unsupported sgp server')
  //         }

  //         matchHistory = await edsm.sgp.getMatchHistoryLcuFormat(
  //           puuid,
  //           (page - 1) * pageSize,
  //           pageSize,
  //           queueFilter === -1 ? undefined : `q_${queueFilter}`,
  //           sgpServerId
  //         )
  //         matchHistorySource = 'sgp'

  //         matchHistory.games.games.forEach((g) => {
  //           tab.data.detailedGamesCache.set(g.gameId, markRaw(g))
  //         })
  //       } else {
  //         if (cf.settings.useSgpApi && eds.sgpAvailability.serversSupported.matchHistory) {
  //           matchHistory = await edsm.sgp.getMatchHistoryLcuFormat(
  //             puuid,
  //             (page - 1) * pageSize,
  //             pageSize,
  //             queueFilter === -1 ? undefined : `q_${queueFilter}`,
  //             sgpServerId
  //           )
  //           matchHistorySource = 'sgp'

  //           matchHistory.games.games.forEach((g) => {
  //             tab.data.detailedGamesCache.set(g.gameId, markRaw(g))
  //           })
  //         } else {
  //           // is lcu
  //           matchHistory = (
  //             await getMatchHistory(puuid, (page - 1) * pageSize, page * pageSize - 1)
  //           ).data
  //         }
  //       }

  //       const matchHistoryWithState = matchHistory.games.games.map((g) => ({
  //         game: tab.data.detailedGamesCache.get(g.gameId) || markRaw(g),
  //         isDetailed: tab.data.detailedGamesCache.get(g.gameId) !== undefined,
  //         isLoading: false,
  //         hasError: false,
  //         isExpanded: previousExpanded.has(g.gameId)
  //       }))

  //       tab.data.matchHistoryPage = {
  //         games: matchHistoryWithState,
  //         _gamesMap: {},
  //         page,
  //         pageSize,
  //         lastUpdate: Date.now(),
  //         queueFilter,
  //         source: matchHistorySource
  //       }

  //       // 用于快速查找
  //       tab.data.matchHistoryPage._gamesMap = matchHistoryWithState.reduce(
  //         (acc, cur) => {
  //           acc[cur.game.gameId] = cur
  //           return acc
  //         },
  //         {} as Record<number, GameDataState>
  //       )

  //       // 异步加载页面战绩
  //       if (cf.settings.fetchDetailedGame) {
  //         const tasks = tab.data.matchHistoryPage.games.map(async (g) => {
  //           try {
  //             if (g.isDetailed) {
  //               return
  //             }

  //             if (tab.data.detailedGamesCache.has(g.game.gameId)) {
  //               g.game = tab.data.detailedGamesCache.get(g.game.gameId)!
  //             } else {
  //               g.isLoading = true
  //               const game = (await getGame(g.game.gameId)).data
  //               g.game = markRaw(game)
  //               tab.data.detailedGamesCache.set(g.game.gameId, game)
  //             }

  //             g.isDetailed = true
  //           } catch (error) {
  //             g.hasError = true
  //             laNotification.warn(
  //               '加载失败',
  //               `页面 ${tab.id} - 拉取详细对局 ${g.game.gameId} 失败`,
  //               error
  //             )
  //           } finally {
  //             g.isLoading = false
  //           }
  //         })

  //         Promise.allSettled(tasks).catch(() => {})
  //       }
  //     } catch (error) {
  //       if (
  //         (error as AxiosError)?.response?.status === 500 ||
  //         (error as AxiosError)?.response?.status === 503
  //       ) {
  //         laNotification.warn(
  //           '加载失败',
  //           `拉取战绩失败，服务器异常。远程服务器返回内部错误 ${(error as AxiosError)?.response?.status}${lc.auth?.rsoPlatformId === 'HN1' ? '，当前服务器为艾欧尼亚，由于服务器原因，特定时间段内无法访问战绩接口。' : ''}`,
  //           error
  //         )
  //         throw error
  //       } else {
  //         laNotification.warn('加载失败', '拉取战绩失败', error)
  //       }
  //     } finally {
  //       tab.data.loading.isLoadingMatchHistory = false
  //     }
  //   }
  // }

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
    const lcs = useLeagueClientStore()

    if (!lcs.auth) {
      return
    }

    if (lcs.summoner.me?.puuid === puuid) {
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

  // 如果直接引用 router, 在热更新的时候会失效
  useNavigateToTab() {
    const router = useRouter()
    const sgps = useSgpStore()

    const navigateToTab = async (puuid: string, sgpServerId?: string) => {
      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      if (!sgpServerId) {
        sgpServerId = sgps.availability.sgpServerId
      }

      return router.replace({
        name: 'match-history',
        params: { puuid, sgpServerId }
      })
    }

    return { navigateToTab }
  }

  parseUnionId(unionId: string) {
    const [sgpServerId, puuid] = unionId.split(':')
    return { sgpServerId, puuid }
  }

  toUnionId(sgpServerId: string, puuid: string) {
    return `${sgpServerId}:${puuid}`
  }

  /** 创建一个新的 Tab, 并设置一些初始值 */
  createTab(puuid: string, sgpServerId: string, setCurrent = true, pin = false) {
    const mhs = useMatchHistoryTabsStore()

    mhs.createTab(
      {
        id: this.toUnionId(sgpServerId, puuid),
        puuid,
        sgpServerId,
        matchHistoryPage: null,
        rankedStats: null,
        savedInfo: null,
        summoner: null,
        spectatorData: null,
        tags: markRaw([]),
        isLoadingTags: false,
        isLoadingSavedInfo: false,
        isLoadingMatchHistory: false,
        isLoadingRankedStats: false,
        isLoadingSummoner: false,
        isLoadingSpectatorData: false,
        pinned: pin
      },
      setCurrent
    )
  }

  private async _handleSettings() {
    const store = useMatchHistoryTabsStore()

    store.settings.refreshTabsAfterGameEnds = await this._setting.get(
      MatchHistoryTabsRenderer.id,
      'refreshTabsAfterGameEnds',
      store.settings.refreshTabsAfterGameEnds
    )

    store.settings.matchHistoryUseSgpApi = await this._setting.get(
      MatchHistoryTabsRenderer.id,
      'matchHistoryUseSgpApi',
      store.settings.matchHistoryUseSgpApi
    )

    watch(
      () => store.settings.refreshTabsAfterGameEnds,
      async (newValue) => {
        await this._setting.set(MatchHistoryTabsRenderer.id, 'refreshTabsAfterGameEnds', newValue)
      }
    )

    watch(
      () => store.settings.matchHistoryUseSgpApi,
      async (newValue) => {
        await this._setting.set(MatchHistoryTabsRenderer.id, 'matchHistoryUseSgpApi', newValue)
      }
    )
  }
}
