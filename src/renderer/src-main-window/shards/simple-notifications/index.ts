import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { useTranslation } from 'i18next-vue'
import { NButton, NotificationReactive, useNotification } from 'naive-ui'
import { CSSProperties, VNodeChild, computed, h, inject, ref, watch } from 'vue'

/**
 * 偶尔会出现在主窗口的周期性通知
 */
@Shard(SimpleNotificationsRenderer.id)
export class SimpleNotificationsRenderer implements IAkariShardInitDispose {
  static id = 'simple-notifications-renderer'

  static NEVER_SHOW_SETTING_KEY = 'neverShowLiveStreamingStreamerMode'
  static LAST_DISMISS_SETTING_KEY = 'lastDismissLiveStreamingStreamerMode'

  constructor(
    @Dep(ClientInstallationRenderer) private readonly _installation: ClientInstallationRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _client: LeagueClientRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setup: SetupInAppScopeRenderer
  ) {}

  _setupStreamerModeNotifications() {
    const { t } = useTranslation()
    const notification = useNotification()
    const installation = useClientInstallationStore()
    const app = useAppCommonStore()
    const appInject = inject('app') as any
    const lcs = useLeagueClientStore()

    const createNotification = (title: () => VNodeChild, reason: () => VNodeChild) => {
      return notification.info({
        title,
        content: () => {
          return h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              } as CSSProperties
            },
            [
              reason(),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    flexWrap: 'wrap'
                  } as CSSProperties
                },
                [
                  h(
                    NButton,
                    {
                      size: 'tiny',
                      secondary: true,
                      onClick: () => {
                        close()
                        this._setting.set(
                          SimpleNotificationsRenderer.id,
                          SimpleNotificationsRenderer.LAST_DISMISS_SETTING_KEY,
                          Date.now()
                        )
                      }
                    },
                    () => t('simple-notifications-renderer.liveStreamingHints.dismiss')
                  ),
                  h(
                    NButton,
                    {
                      size: 'tiny',
                      type: 'warning',
                      secondary: true,
                      onClick: () => {
                        close()
                        this._setting.set(
                          SimpleNotificationsRenderer.id,
                          SimpleNotificationsRenderer.NEVER_SHOW_SETTING_KEY,
                          true
                        )
                      }
                    },
                    () => t('simple-notifications-renderer.liveStreamingHints.neverShowAgain')
                  ),
                  h(
                    NButton,
                    {
                      size: 'tiny',
                      type: 'primary',
                      onClick: () => {
                        close()

                        appInject.openSettingsModal('misc')
                        this._setting.set(
                          SimpleNotificationsRenderer.id,
                          SimpleNotificationsRenderer.NEVER_SHOW_SETTING_KEY,
                          true
                        )
                      }
                    },
                    () => t('simple-notifications-renderer.liveStreamingHints.toSettings')
                  )
                ]
              )
            ]
          )
        },
        onClose: () => {
          this._setting.set(
            SimpleNotificationsRenderer.id,
            SimpleNotificationsRenderer.LAST_DISMISS_SETTING_KEY,
            Date.now()
          )
        }
      })
    }

    let inst: NotificationReactive | null = null

    const close = () => {
      if (inst) {
        inst.destroy()
        inst = null
      }
    }

    const leagueClientStreamerModeEnabled = ref(false)

    const checkStreamerModeInSettings = async () => {
      const { data } = await this._client._http.get(
        '/lol-settings/v2/account/GamePreferences/game-settings'
      )

      if (data?.data?.['HUD']?.['HidePlayerNames'] === true) {
        leagueClientStreamerModeEnabled.value = true
      } else {
        leagueClientStreamerModeEnabled.value = false
      }
    }

    this._client.onLcuEventVue(
      '/lol-settings/v2/account/GamePreferences/game-settings',
      ({ data }) => {
        if (data?.data?.['HUD']?.['HidePlayerNames'] === true) {
          leagueClientStreamerModeEnabled.value = true
        } else {
          leagueClientStreamerModeEnabled.value = false
        }
      }
    )

    watch(
      () => lcs.isConnected,
      (connected) => {
        if (connected) {
          checkStreamerModeInSettings()
        }
      },
      {
        immediate: true
      }
    )

    const shouldRemind = computed(() => {
      if (inst || app.settings.streamerMode) {
        return false
      }

      if (installation.detectedLiveStreamingClients.length) {
        return 'live-tools'
      }

      if (leagueClientStreamerModeEnabled.value) {
        return 'client-settings'
      }

      return false
    })

    watch(
      () => shouldRemind.value,
      async (should) => {
        if (!should) {
          return
        }

        const v = await this._setting.get(
          SimpleNotificationsRenderer.id,
          SimpleNotificationsRenderer.NEVER_SHOW_SETTING_KEY,
          false
        )

        if (v) {
          return
        }

        const l = await this._setting.get(
          SimpleNotificationsRenderer.id,
          SimpleNotificationsRenderer.LAST_DISMISS_SETTING_KEY,
          0
        )

        if (Date.now() - l < 3 * 24 * 60 * 60 * 1000) {
          return
        }

        if (should === 'live-tools') {
          inst = createNotification(
            () => t('simple-notifications-renderer.liveStreamingHints.detected.title'),
            () =>
              h('span', t('simple-notifications-renderer.liveStreamingHints.detected.liveTools'))
          )
        } else {
          inst = createNotification(
            () => t('simple-notifications-renderer.liveStreamingHints.detected.title'),
            () =>
              h('span', t('simple-notifications-renderer.liveStreamingHints.detected.bySettings'))
          )
        }
      },
      {
        immediate: true
      }
    )
  }

  private _setupSimpleNotifications() {
    this._setupStreamerModeNotifications()
  }

  async onInit() {
    this._setup.addSetupFn(() => this._setupSimpleNotifications())
  }
}
