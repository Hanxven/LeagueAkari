import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { computed, effectScope, watch } from 'vue'

import { useMicaAvailability } from '@main-window/compositions/useMicaAvailability'
import { router } from '@main-window/routes'

import { useMatchHistoryTabsStore } from '../match-history-tabs/store'
import { useMainWindowUiStore } from './store'

@Shard(MainWindowUiRenderer.id)
export class MainWindowUiRenderer implements IAkariShardInitDispose {
  static id = 'main-window-ui-renderer'

  private readonly _scope = effectScope()

  private readonly _urlCache = new Map<number, string>()

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _lc: LeagueClientRenderer,
    @Dep(LoggerRenderer) private readonly _log: LoggerRenderer
  ) {}

  async onInit() {
    await this._handleSettings()
    this._scope.run(() => {
      this._handleSyncProfileSkinUrl()
    })
  }

  async onDispose() {
    this._scope.stop()
  }

  private _handleSyncProfileSkinUrl() {
    const lcs = useLeagueClientStore()
    const mui = useMainWindowUiStore()
    const mhs = useMatchHistoryTabsStore()

    const preferMica = useMicaAvailability()

    watch(
      [
        () => lcs.summoner.profile,
        () => mui.frontendSettings.useProfileSkinAsBackground,
        () => preferMica.value
      ],
      async ([profile, enabled, preferMica]) => {
        if (!enabled || preferMica) {
          mui.backgroundSkinUrl = null
          return
        }

        if (profile && profile.backgroundSkinId) {
          try {
            const url = await this._getChampionSkinUrl(profile.backgroundSkinId)

            if (url === null) {
              this._log.warn(MainWindowUiRenderer.id, `Skin ${profile.backgroundSkinId} not found`)
              return
            }

            mui.backgroundSkinUrl = url
          } catch (error) {
            // 静默失败
            this._log.warn(MainWindowUiRenderer.id, 'Failed to get skin details', error)
          }
        }
      },
      { immediate: true }
    )

    const currentTabProfileSkinId = computed(() => {
      if (
        router.currentRoute.value.name === 'match-history' &&
        mhs.currentTab &&
        mhs.currentTab.summonerProfile &&
        mhs.currentTab.summonerProfile.backgroundSkinId
      ) {
        return mhs.currentTab.summonerProfile.backgroundSkinId
      }

      return null
    })

    // 获取当前页面的皮肤, 需要注意的是, 如果目标用户没有设置皮肤, 则 backgroundSkinId 不存在
    // 此时在其主页展示的内容为默认成就最高的英雄
    watch(
      [() => currentTabProfileSkinId.value, () => mui.frontendSettings.useProfileSkinAsBackground],
      async ([skinId, enabled]) => {
        if (skinId && enabled) {
          try {
            const url = await this._getChampionSkinUrl(skinId)

            if (url === null) {
              mui.tabBackgroundSkinUrl = null // tab 的皮肤 url 强同步
              this._log.warn(MainWindowUiRenderer.id, `Skin ${skinId} not found`)
              return
            }

            mui.tabBackgroundSkinUrl = url
          } catch (error) {
            mui.tabBackgroundSkinUrl = null
            this._log.warn(MainWindowUiRenderer.id, 'Failed to get skin details', error)
          }
        } else {
          mui.tabBackgroundSkinUrl = null
        }
      },
      { immediate: true }
    )
  }

  private async _getChampionSkinUrl(skinId: number) {
    if (this._urlCache.has(skinId)) {
      return LeagueClientRenderer.url(this._urlCache.get(skinId)!)
    }

    const championId = skinId.toString().slice(0, -3)
    const { data } = await this._lc.api.gameData.getChampDetails(Number(championId))

    for (const skin of data.skins) {
      if (skin.id === skinId) {
        this._urlCache.set(skinId, skin.splashPath)
        return LeagueClientRenderer.url(skin.splashPath)
      }

      if (skin.questSkinInfo) {
        for (const tier of skin.questSkinInfo.tiers) {
          if (tier.id === skinId) {
            this._urlCache.set(skinId, tier.splashPath)
            return LeagueClientRenderer.url(tier.splashPath)
          }
        }
      }
    }

    return null
  }

  private async _handleSettings() {
    const store = useMainWindowUiStore()

    await this._setting.savedPropVue(
      MainWindowUiRenderer.id,
      store.frontendSettings,
      'useProfileSkinAsBackground'
    )
  }

  usePreferredBackgroundImageUrl() {
    const store = useMainWindowUiStore()
    const preferMica = useMicaAvailability()

    const backgroundImageUrl = computed(() => {
      if (preferMica.value) {
        return null
      }

      if (store.frontendSettings.useProfileSkinAsBackground) {
        if (store.tabBackgroundSkinUrl) {
          return LeagueClientRenderer.url(store.tabBackgroundSkinUrl)
        }

        if (store.backgroundSkinUrl) {
          return LeagueClientRenderer.url(store.backgroundSkinUrl)
        }
      }

      return null
    })

    return backgroundImageUrl
  }
}
