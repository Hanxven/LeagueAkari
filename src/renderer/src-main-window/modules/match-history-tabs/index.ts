import { LeagueAkariRendererModule } from '@renderer-shared/akari-ipc/renderer-akari-module'
import { getGame, getMatchHistory } from '@renderer-shared/http-api/match-history'
import { getRankedStats } from '@renderer-shared/http-api/ranked'
import { getSummonerByPuuid } from '@renderer-shared/http-api/summoner'
import { useCoreFunctionalityStore } from '@renderer-shared/modules/core-functionality/store'
import { externalDataSourceRendererModule as edsm } from '@renderer-shared/modules/external-data-source'
import { useExternalDataSourceStore } from '@renderer-shared/modules/external-data-source/store'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { useGameflowStore } from '@renderer-shared/modules/lcu-state-sync/gameflow'
import { useSummonerStore } from '@renderer-shared/modules/lcu-state-sync/summoner'
import { StorageRendererModule } from '@renderer-shared/modules/storage'
import { tgpApiRendererModule as tam } from '@renderer-shared/modules/tgp-api'
import { useTgpApiStore } from '@renderer-shared/modules/tgp-api/store'
import { laNotification } from '@renderer-shared/notification'
import { getPlayerAccountNameset } from '@renderer-shared/rc-http-api/rc-api'
import { EMPTY_PUUID } from '@shared/constants/common'
import { BattleDetail } from '@shared/data-sources/tgp/types'
import { Game, MatchHistory } from '@shared/types/lcu/match-history'
import { summonerName } from '@shared/utils/name'
import { TGP_AREA_ID_SGP } from '@shared/utils/platform-names'
import { AxiosError } from 'axios'
import { computed, markRaw, watch } from 'vue'
import { useRouter } from 'vue-router'

import { MatchHistoryGameTabCard, TabState, useMatchHistoryTabsStore } from './store'

/**
 * 仅适用于主窗口战绩页面的渲染端模块
 */
export class MatchHistoryTabsRendererModule extends LeagueAkariRendererModule {
  private _storageModule!: StorageRendererModule

  constructor() {
    super('match-history-tabs-fe', true)
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
    const eds = useExternalDataSourceStore()

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
          const set = new Set<string>(Object.keys(cf.ongoingPlayers))

          for (const tab of mh.tabs) {
            if (set.has(tab.data.puuid)) {
              this.fetchTabMatchHistory(this.toUnionId(tab.data.sgpServerId, tab.data.puuid))
            }
          }
        }
      }
    )

    // 当前召唤师登录时，立即创建一个页面
    watch(
      [() => summoner.me, () => eds.sgpAvailability.sgpServerId],
      ([me, sgpServerId]) => {
        if (me) {
          mh.tabs.forEach((t) => mh.setTabPinned(t.id, false))

          const unionId = `${sgpServerId}/${me.puuid}`

          if (mh.getTab(unionId)) {
            mh.setTabPinned(unionId, true)
          } else {
            this.createTab(unionId, { pin: true })
            this.fetchTabFullData(unionId)
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
      () => cf.settings.useSgpApi,
      (y) => {
        if (!y) {
          mh.tabs.forEach((t) => {
            t.data.matchHistory.queueFilter = -1
          })
        }
      }
    )
  }

  private _isCrossRegion(targetSgpServerId: string) {
    const eds = useExternalDataSourceStore()

    return eds.sgpAvailability.sgpServerId !== targetSgpServerId
  }

  async fetchTabFullData(unionId: string) {
    const lc = useLcuConnectionStore()
    const self = useSummonerStore()
    const mh = useMatchHistoryTabsStore()

    const loadSummoner = async () => {
      await this.fetchTabSummoner(unionId)
    }

    const loadMatchHistoryTask = async () => {
      await this.fetchTabMatchHistory(unionId, 1)
    }

    const loadRankedStatsTask = async () => {
      await this.fetchTabRankedStats(unionId)
    }

    const loadSavedInfoTask = async () => {
      await this.querySavedInfo(unionId)
    }

    const [summonerR, matchHistoryR, rankedStatsR, savedInfoR] = await Promise.allSettled([
      loadSummoner(),
      loadMatchHistoryTask(),
      loadRankedStatsTask(),
      loadSavedInfoTask()
    ])

    if (summonerR.status === 'fulfilled') {
      const tab = mh.getTab(unionId)
      if (
        lc.auth &&
        self.me &&
        tab &&
        tab.data.summoner &&
        !this._isCrossRegion(tab.data.sgpServerId) // 暂时不会记录跨区玩家
      ) {
        this.saveLocalStorageSearchHistory(
          summonerName(tab.data.summoner.gameName, tab.data.summoner.tagLine),
          tab.data.summoner.puuid,
          lc.auth.region,
          lc.auth.rsoPlatformId,
          self.me.puuid
        )
      }
    } else {
      throw summonerR.reason
    }

    if (matchHistoryR.status === 'rejected') {
      throw matchHistoryR.reason
    }

    if (rankedStatsR.status === 'rejected') {
      throw rankedStatsR.reason
    }

    if (savedInfoR.status === 'rejected') {
      throw savedInfoR.reason
    }
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

  async fetchTgpScore(puuid: string, gameId: number) {
    const mh = useMatchHistoryTabsStore()
    const ta = useTgpApiStore()

    if (mh.currentTab) {
      if (ta.settings.enabled && !ta.settings.expired) {
        const match = mh.currentTab.data.matchHistory._gamesMap[gameId]
        if (match.hasTgpScore) {
          return
        }

        let battleDetail: BattleDetail | null = null;
        if (mh.currentTab.data.detailedBattleCache.has(gameId)) {
          battleDetail = mh.currentTab.data.detailedBattleCache.get(gameId)!
        } else {
          const tgpGame = await tam.getBattleDetail(TGP_AREA_ID_SGP[mh.currentTab.data.sgpServerId][0], gameId)
          if (tgpGame) {
            battleDetail = tgpGame.battle_detail
            if (battleDetail) {
              mh.currentTab.data.detailedBattleCache.set(gameId, battleDetail)
            }
          }
        }

        if (battleDetail) {
          this._mapTgpScoreToParticipant(battleDetail, match.game)
          match.hasTgpScore = true
          match.game = { ...match.game }
        }
      }
    }
  }

  private _mapTgpScoreToParticipant(battleDetail: BattleDetail, game: Game) {
    battleDetail.player_details.forEach((playerDetail) => {
      const participantIdentity = game.participantIdentities.find(
        (identity) => identity.player.puuid === playerDetail.original_puu_id
      )
      if (participantIdentity) {
        const participant = game.participants.find(
          (p) => p.participantId === participantIdentity.participantId
        )

        if (participant) {
          participant.stats.score = playerDetail.gameScore
        }
      }
    })
  }

  async querySavedInfo(unionId: string) {
    const summoner = useSummonerStore()
    const mh = useMatchHistoryTabsStore()
    const lc = useLcuConnectionStore()

    if (!lc.auth || !summoner.me) {
      return
    }

    const tab = mh.getTab(unionId)

    const { puuid } = this.parseUnionId(unionId)

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

  async fetchTabRankedStats(unionId: string) {
    const mh = useMatchHistoryTabsStore()

    const { puuid, sgpServerId } = this.parseUnionId(unionId)

    if (this._isCrossRegion(sgpServerId)) {
      return
    }

    const tab = mh.getTab(unionId)
    if (tab) {
      if (tab.data.loading.isLoadingRankedStats) {
        return
      }

      tab.data.loading.isLoadingRankedStats = true

      try {
        const rankedStats = (await getRankedStats(puuid)).data
        tab.data.rankedStats = markRaw(rankedStats)
      } catch (error) {
        laNotification.warn('加载失败', '拉取段位信息失败', error)
        throw error
      } finally {
        tab.data.loading.isLoadingRankedStats = false
      }
    }
  }

  async fetchTabSummoner(unionId: string) {
    const mh = useMatchHistoryTabsStore()
    const eds = useExternalDataSourceStore()
    const tab = mh.getTab(unionId)

    const { puuid, sgpServerId } = this.parseUnionId(unionId)

    if (tab) {
      if (tab.data.loading.isLoadingSummoner) {
        return
      }

      tab.data.loading.isLoadingSummoner = true

      try {
        if (this._isCrossRegion(sgpServerId)) {
          if (!eds.sgpAvailability.sgpServers.servers[sgpServerId].common) {
            throw new Error('Unsupported sgp server')
          }

          const summoner = await edsm.sgp.getSummonerLcuFormat(puuid, sgpServerId)

          const ns = await getPlayerAccountNameset(puuid)
          summoner.gameName = ns.gnt.gameName
          summoner.tagLine = ns.gnt.tagLine

          tab.data.summoner = markRaw(summoner)
        } else {
          const summoner = (await getSummonerByPuuid(puuid)).data
          tab.data.summoner = markRaw(summoner)
        }
      } catch (error) {
        laNotification.warn('加载失败', '拉取召唤师信息失败', error)
        throw error
      } finally {
        tab.data.loading.isLoadingSummoner = false
      }
    }
  }

  async fetchTabMatchHistory(
    unionId: string,
    page?: number,
    pageSize?: number,
    queueFilter?: number | string | null
  ) {
    const cf = useCoreFunctionalityStore()
    const mh = useMatchHistoryTabsStore()
    const lc = useLcuConnectionStore()
    const eds = useExternalDataSourceStore()
    const ta = useTgpApiStore()

    const tab = mh.getTab(unionId)

    const { puuid, sgpServerId } = this.parseUnionId(unionId)

    if (tab) {
      if (tab.data.loading.isLoadingMatchHistory) {
        return
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
        let matchHistorySource: 'sgp' | 'lcu' = 'lcu'
        if (this._isCrossRegion(sgpServerId)) {
          if (!eds.sgpAvailability.sgpServers.servers[sgpServerId]) {
            throw new Error('Unsupported sgp server')
          }

          matchHistory = await edsm.sgp.getMatchHistoryLcuFormat(
            puuid,
            (page - 1) * pageSize,
            pageSize,
            queueFilter === -1 ? undefined : `q_${queueFilter}`,
            sgpServerId
          )
          matchHistorySource = 'sgp'

          matchHistory.games.games.forEach((g) => {
            tab.data.detailedGamesCache.set(g.gameId, markRaw(g))
          })
        } else {
          if (cf.settings.useSgpApi && eds.sgpAvailability.serversSupported.matchHistory) {
            matchHistory = await edsm.sgp.getMatchHistoryLcuFormat(
              puuid,
              (page - 1) * pageSize,
              pageSize,
              queueFilter === -1 ? undefined : `q_${queueFilter}`,
              sgpServerId
            )
            matchHistorySource = 'sgp'

            matchHistory.games.games.forEach((g) => {
              tab.data.detailedGamesCache.set(g.gameId, markRaw(g))
            })
          } else {
            // is lcu
            matchHistory = (
              await getMatchHistory(puuid, (page - 1) * pageSize, page * pageSize - 1)
            ).data
          }
        }

        const matchHistoryWithState = matchHistory.games.games.map((g) => ({
          game: tab.data.detailedGamesCache.get(g.gameId) || markRaw(g),
          battle: undefined,
          isDetailed: tab.data.detailedGamesCache.get(g.gameId) !== undefined,
          isLoading: false,
          hasError: false,
          isExpanded: previousExpanded.has(g.gameId)
        }))

        tab.data.matchHistory = {
          games: matchHistoryWithState,
          _gamesMap: {},
          page,
          pageSize,
          lastUpdate: Date.now(),
          queueFilter,
          source: matchHistorySource
        }

        // 用于快速查找
        tab.data.matchHistory._gamesMap = matchHistoryWithState.reduce(
          (acc, cur) => {
            acc[cur.game.gameId] = cur
            return acc
          },
          {} as Record<number, MatchHistoryGameTabCard>
        )

        // 加载 TGP 对局列表
        if (ta.settings.enabled && !ta.settings.expired && tab.data.summoner) {
          const players = await tam.searchPlayer(`${tab.data.summoner.gameName}#${tab.data.summoner.tagLine}`)
          if (players && players[0]) {
            const battles = await tam.getBattleList(players[0], page, pageSize, queueFilter)
            if (battles && battles.length !== 0) {
              tab.data.matchHistory.games.forEach((g) => {
                const battle = battles.find((battle) => g.game.gameId.toString() === battle.game_id)
                if (battle) {
                  g.battle = markRaw(battle)
                }
              })
            } else {
              laNotification.warn('拉取WeGame数据异常', `WeGame找不到相关战绩！`)
            }
          }
        }

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
          throw error
        } else {
          laNotification.warn('加载失败', '拉取战绩失败', error)
        }
      } finally {
        tab.data.loading.isLoadingMatchHistory = false
      }
    }
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

  // 如果直接引用 router, 在热更新的时候会失效
  useNavigateToTab() {
    const router = useRouter()

    const navigateToTab = (puuid: string, sgpServerId?: string) => {
      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      const eds = useExternalDataSourceStore()

      if (!sgpServerId) {
        sgpServerId = eds.sgpAvailability.sgpServerId
      }

      router.replace({
        name: 'match-history',
        params: { puuid, sgpServerId }
      })
    }

    return { navigateToTab }
  }

  parseUnionId(unionId: string) {
    const [sgpServerId, puuid] = unionId.split('/')
    return { sgpServerId, puuid }
  }

  toUnionId(sgpServerId: string, puuid: string) {
    return `${sgpServerId}/${puuid}`
  }

  /** 创建一个新的 Tab 并自动进行初始化操作 */
  createTab(unionId: string, options: { setCurrent?: boolean; pin?: boolean } = {}) {
    const store = useMatchHistoryTabsStore()

    const tab = store.getTab(unionId)
    if (tab) {
      if (options.setCurrent) {
        store.setCurrentTab(unionId)
      }
      return
    }

    const [sgpServerId, puuid] = unionId.split('/')

    const newTab: TabState = {
      puuid,
      sgpServerId,
      matchHistory: {
        games: [],
        source: 'none',
        _gamesMap: {},
        page: 1,
        pageSize: 20,
        lastUpdate: Date.now(),
        queueFilter: -1
      },
      detailedGamesCache: markRaw(new Map()),
      detailedBattleCache: markRaw(new Map()),
      loading: {
        isLoadingSummoner: false,
        isLoadingMatchHistory: false,
        isLoadingRankedStats: false
      }
    }

    store.addTab(unionId, newTab, options)

    if (options.setCurrent) {
      store.setCurrentTab(unionId)
    }
  }

  setMatchHistoryExpand(unionId: string, gameId: number, expand: boolean) {
    const store = useMatchHistoryTabsStore()
    const tab = store.getTab(unionId)

    if (tab) {
      const match = tab.data.matchHistory._gamesMap[gameId]
      if (match) {
        match.isExpanded = expand
      }
    }
  }

  setQueueFilter(puuid: string, queue: number) {
    const store = useMatchHistoryTabsStore()
    const tab = store.getTab(puuid)

    if (tab) {
      tab.data.matchHistory.queueFilter = queue
    }
  }
}

export const matchHistoryTabsRendererModule = new MatchHistoryTabsRendererModule()
