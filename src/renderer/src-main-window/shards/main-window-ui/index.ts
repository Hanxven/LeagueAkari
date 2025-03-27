import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { computed, effectScope, watch } from 'vue'

import { useMicaAvailability } from '@main-window/compositions/useMicaAvailability'
import { router } from '@main-window/routes'

import { useMatchHistoryTabsStore } from '../match-history-tabs/store'
import { useMainWindowUiStore } from './store'

export class MainWindowUiRenderer implements IAkariShardInitDispose {
  static id = 'main-window-ui-renderer'
  static dependencies = [SettingUtilsRenderer.id, LeagueClientRenderer.id, LoggerRenderer.id]

  private readonly _setting: SettingUtilsRenderer
  private readonly _lc: LeagueClientRenderer
  private readonly _log: LoggerRenderer
  private readonly _scope = effectScope()

  private readonly _urlCache = new Map<number, string>()

  constructor(deps: any) {
    this._setting = deps[SettingUtilsRenderer.id]
    this._lc = deps[LeagueClientRenderer.id]
    this._log = deps[LoggerRenderer.id]
  }

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
        () => mui.settings.useProfileSkinAsBackground,
        () => preferMica.value
      ],
      async ([profile, enabled, preferMica]) => {
        if (!enabled || preferMica) {
          mui.backgroundSkinUrl = ''
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
      [() => currentTabProfileSkinId.value, () => mui.settings.useProfileSkinAsBackground],
      async ([skinId, enabled]) => {
        if (skinId && enabled) {
          try {
            const url = await this._getChampionSkinUrl(skinId)

            if (url === null) {
              mui.tabBackgroundSkinUrl = '' // tab 的皮肤 url 强同步
              this._log.warn(MainWindowUiRenderer.id, `Skin ${skinId} not found`)
              return
            }

            mui.tabBackgroundSkinUrl = url
          } catch (error) {
            mui.tabBackgroundSkinUrl = ''
            this._log.warn(MainWindowUiRenderer.id, 'Failed to get skin details', error)
          }
        } else {
          mui.tabBackgroundSkinUrl = ''
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

    await this._setting.savedGetterVue(
      MainWindowUiRenderer.id,
      'useProfileSkinAsBackground',
      () => store.settings.useProfileSkinAsBackground,
      (v) => (store.settings.useProfileSkinAsBackground = v)
    )

    await this._setting.savedGetterVue(
      MainWindowUiRenderer.id,
      'customBackgroundSkinPath',
      () => store.settings.customBackgroundSkinPath,
      (v) => (store.settings.customBackgroundSkinPath = v)
    )
  }
}
