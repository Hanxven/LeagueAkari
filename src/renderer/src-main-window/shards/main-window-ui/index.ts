import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { effectScope, watch } from 'vue'

import { useMainWindowUiStore } from './store'

export class MainWindowUiRenderer implements IAkariShardInitDispose {
  static id = 'main-window-ui-renderer'
  static dependencies = ['setting-utils-renderer', 'league-client-renderer', 'logger-renderer']

  private readonly _setting: SettingUtilsRenderer
  private readonly _lc: LeagueClientRenderer
  private readonly _log: LoggerRenderer
  private readonly _scope = effectScope()

  constructor(deps: any) {
    this._setting = deps['setting-utils-renderer']
    this._lc = deps['league-client-renderer']
    this._log = deps['logger-renderer']
  }

  async onInit() {
    this._scope.run(() => {
      this._handleSettings()
      this._handleSyncProfileSkinUrl()
    })
  }

  async onDispose() {
    this._scope.stop()
  }

  private _handleSyncProfileSkinUrl() {
    const lcs = useLeagueClientStore()
    const mui = useMainWindowUiStore()

    watch(
      [() => lcs.summoner.profile, () => mui.settings.useProfileSkinAsBackground],
      async ([profile, enabledVV]) => {
        if (enabledVV !== undefined && !enabledVV) {
          mui.backgroundSkinUrl = ''
          return
        }

        if (profile) {
          const championId = profile.backgroundSkinId.toString().slice(0, -3)

          try {
            const { data } = await this._lc.api.gameData.getChampDetails(Number(championId))

            for (const skin of data.skins) {
              if (skin.id === profile.backgroundSkinId) {
                mui.backgroundSkinUrl = this._lc.url(skin.splashPath)
                return
              }

              if (skin.questSkinInfo) {
                for (const tier of skin.questSkinInfo.tiers) {
                  if (tier.id === profile.backgroundSkinId) {
                    mui.backgroundSkinUrl = this._lc.url(tier.splashPath)
                    return
                  }
                }
              }
            }

            this._log.warn(MainWindowUiRenderer.id, `Skin ${profile.backgroundSkinId} not found`)
          } catch (error) {
            // 静默失败
            this._log.warn(MainWindowUiRenderer.id, 'Failed to get skin details', error)
          }
        }
      },
      { immediate: true }
    )
  }

  private async _handleSettings() {
    const store = useMainWindowUiStore()

    store.settings.useProfileSkinAsBackground = await this._setting.get(
      MainWindowUiRenderer.id,
      'useProfileSkinAsBackground',
      store.settings.useProfileSkinAsBackground
    )

    watch(
      () => store.settings.useProfileSkinAsBackground,
      async (newValue) => {
        await this._setting.set(MainWindowUiRenderer.id, 'useProfileSkinAsBackground', newValue)
      }
    )
  }
}
