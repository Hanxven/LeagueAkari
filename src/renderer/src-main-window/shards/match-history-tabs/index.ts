import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { createEventBus } from '@renderer-shared/utils/events'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { EMPTY_PUUID } from '@shared/constants/common'
import { effectScope, markRaw, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useMatchHistoryTabsStore } from './store'

export interface SearchHistoryItem {
  // 目标的 puuid, 当作主键
  puuid: string

  // 目标所属的服务器
  sgpServerId: string

  // 不是必要项, 但用于展示很方便
  summoner: {
    gameName: string
    tagLine: string
  }
}

/**
 * 仅适用于主窗口战绩页面的渲染端模块
 */
@Shard(MatchHistoryTabsRenderer.id)
export class MatchHistoryTabsRenderer implements IAkariShardInitDispose {
  static id = 'match-history-tabs-renderer'

  static SEARCH_HISTORY_KEY = 'searchHistory'
  static SEARCH_HISTORY_MAX_LENGTH = 20

  private readonly _scope = effectScope()

  private readonly _events = createEventBus()

  constructor(@Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer) {}

  async onInit() {
    await this._handleSettings()
    this._scope.run(() => {
      this._handleMatchHistoryTabs()
    })
  }

  async onDispose() {
    this._scope.stop()
  }

  private _handleMatchHistoryTabs() {
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

    watch(
      () => lcs.summoner.profile,
      (profile) => {
        if (profile && lcs.summoner.me) {
          const tab = mhs.getTabByPuuid(lcs.summoner.me.puuid)
          if (tab) {
            tab.summonerProfile = markRaw(profile)
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
   * 获取搜索历史, 有数量限制
   */
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    return this._setting.get(
      MatchHistoryTabsRenderer.id,
      MatchHistoryTabsRenderer.SEARCH_HISTORY_KEY,
      []
    )
  }

  /**
   * 使用全量替换的方式更新搜索历史
   * @param item
   */
  async saveSearchHistory(item: SearchHistoryItem) {
    const items = await this.getSearchHistory()

    // 先查重, 若存在, 则将其放到第一位
    const index = items.findIndex((i) => i.puuid === item.puuid)
    if (index !== -1) {
      items.splice(index, 1)
    }

    items.unshift(item)

    if (items.length > MatchHistoryTabsRenderer.SEARCH_HISTORY_MAX_LENGTH) {
      items.pop()
    }

    return this._setting.set(
      MatchHistoryTabsRenderer.id,
      MatchHistoryTabsRenderer.SEARCH_HISTORY_KEY,
      items
    )
  }

  async deleteSearchHistory(puuid: string) {
    const items = await this.getSearchHistory()
    const index = items.findIndex((i) => i.puuid === puuid)

    if (index !== -1) {
      items.splice(index, 1)
    }

    return this._setting.set(
      MatchHistoryTabsRenderer.id,
      MatchHistoryTabsRenderer.SEARCH_HISTORY_KEY,
      items
    )
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
  createTab(puuid: string, sgpServerId: string, setCurrent = true) {
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
        summonerProfile: null,
        tags: markRaw([]),
        isLoadingTags: false,
        isLoadingSavedInfo: false,
        isLoadingMatchHistory: false,
        isLoadingRankedStats: false,
        isLoadingSummoner: false,
        isLoadingSpectatorData: false,
        isLoadingSummonerProfile: false,
        isTakingScreenshot: false
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

    await this._setting.savedGetterVue(
      MatchHistoryTabsRenderer.id,
      'refreshTabsAfterGameEnds',
      () => store.settings.refreshTabsAfterGameEnds,
      (v) => (store.settings.refreshTabsAfterGameEnds = v)
    )

    await this._setting.savedGetterVue(
      MatchHistoryTabsRenderer.id,
      'matchHistoryUseSgpApi',
      () => store.settings.matchHistoryUseSgpApi,
      (v) => (store.settings.matchHistoryUseSgpApi = v)
    )
  }
}
