import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { createEventBus } from '@renderer-shared/utils/events'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { EMPTY_PUUID } from '@shared/constants/common'
import { UseEventBusReturn, useEventBus } from '@vueuse/core'
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

  private readonly _events = createEventBus()

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

    // 当前召唤师登录时，立即创建一个页面
    watch(
      [() => lcs.summoner.me, () => sgps.availability.sgpServerId],
      ([me, sgpServerId]) => {
        if (me && sgpServerId) {
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

  get events() {
    if (!this._events) {
      throw new Error('event emitter is not ready')
    }

    return this._events
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

    const navigateToTab = async (unionId: string) => {
      const { sgpServerId, puuid } = this.parseUnionId(unionId)

      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'match-history',
        params: { puuid, sgpServerId }
      })
    }

    const navigateToTabByPuuidAndSgpServerId = async (puuid: string, sgpServerId: string) => {
      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'match-history',
        params: { puuid, sgpServerId }
      })
    }

    /**
     * 以当前大区为准跳转到指定 puuid 的战绩页面
     */
    const navigateToTabByPuuid = async (puuid: string) => {
      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'match-history',
        params: { puuid, sgpServerId: sgps.availability.sgpServerId }
      })
    }

    return { navigateToTab, navigateToTabByPuuidAndSgpServerId, navigateToTabByPuuid }
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

    if (mhs.getTab(this.toUnionId(sgpServerId, puuid))) {
      return
    }

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
        isLoadingSpectatorData: false
      },
      setCurrent
    )
  }

  setCurrentOrCreateTab(puuid: string, sgpServerId: string) {
    const mhs = useMatchHistoryTabsStore()
    const tab = mhs.getTab(this.toUnionId(sgpServerId, puuid))

    if (tab) {
      mhs.setCurrentTab(tab.id)
    } else {
      this.createTab(puuid, sgpServerId)
    }
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
