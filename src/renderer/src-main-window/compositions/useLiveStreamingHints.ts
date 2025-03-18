import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { useTranslation } from 'i18next-vue'
import { NButton, NotificationReactive, useNotification } from 'naive-ui'
import { CSSProperties, h, watch } from 'vue'

const NAMESPACE = 'composition:useLiveStreamingHints'
const NEVER_SHOW_SETTING_KEY = 'neverShowLiveStreamingStreamerMode'
const LAST_DISMISS_SETTING_KEY = 'lastDismissLiveStreamingStreamerMode'

export function useLiveStreamingHints(options?: { onToSettings?: () => void }) {
  const { onToSettings } = options || {}

  const notification = useNotification()
  const installation = useClientInstallationStore()
  const app = useAppCommonStore()
  const setting = useInstance(SettingUtilsRenderer)
  const { t } = useTranslation()

  let inst: NotificationReactive | null = null

  const close = () => {
    if (inst) {
      inst.destroy()
      inst = null
    }
  }

  watch(
    () => installation.detectedLiveStreamingClients,
    async (clients) => {
      if (!clients.length || inst || app.frontendSettings.streamerMode) {
        return
      }

      const v = await setting.get(NAMESPACE, NEVER_SHOW_SETTING_KEY, false)

      if (v) {
        return
      }

      const l = await setting.get(NAMESPACE, LAST_DISMISS_SETTING_KEY, 0)

      if (Date.now() - l < 3 * 24 * 60 * 60 * 1000) {
        return
      }

      inst = notification.info({
        title: () => t('useLiveStreamingHints.liveStreamingDetected.title'),
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
              h(
                'span',
                t('useLiveStreamingHints.liveStreamingDetected.hintToStreamerModeSettings')
              ),
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
                        setting.set(NAMESPACE, LAST_DISMISS_SETTING_KEY, Date.now())
                      }
                    },
                    () => t('useLiveStreamingHints.dismiss')
                  ),
                  h(
                    NButton,
                    {
                      size: 'tiny',
                      type: 'warning',
                      secondary: true,
                      onClick: () => {
                        close()
                        setting.set(NAMESPACE, NEVER_SHOW_SETTING_KEY, true)
                      }
                    },
                    () => t('useLiveStreamingHints.neverShowAgain')
                  ),
                  h(
                    NButton,
                    {
                      size: 'tiny',
                      type: 'primary',
                      onClick: () => {
                        close()
                        if (onToSettings) {
                          onToSettings()
                          setting.set(NAMESPACE, NEVER_SHOW_SETTING_KEY, true)
                        }
                      }
                    },
                    () => t('useLiveStreamingHints.toSettings')
                  )
                ]
              )
            ]
          )
        },
        onClose: () => {
          setting.set(NAMESPACE, LAST_DISMISS_SETTING_KEY, Date.now())
        }
      })
    },
    {
      immediate: true
    }
  )
}
