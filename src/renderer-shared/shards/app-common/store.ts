import { usePreferredColorScheme } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowReactive, shallowRef } from 'vue'

interface BaseConfig {
  disableHardwareAcceleration?: boolean
}

export interface HttpProxySetting {
  strategy: 'auto' | 'force' | 'disable'
  port: number
  host: string
}

export const useAppCommonStore = defineStore('shard:app-common-renderer', () => {
  const settings = shallowReactive({
    showFreeSoftwareDeclaration: false,
    isInKyokoMode: false,
    locale: 'zh-CN',
    theme: 'default' as 'default' | 'dark' | 'light',
    httpProxy: {
      strategy: 'auto' as 'auto' | 'force' | 'disable',
      port: 0,
      host: ''
    } as HttpProxySetting,
    forceDisableProxy: false,
    streamerMode: false,
    streamerModeUseAkariStyledName: false
  })

  const version = ref('0.0.0')
  const isRabiVersion = computed(() => version.value.includes('-rabi'))
  const isAdministrator = ref(false)
  const disableHardwareAcceleration = ref(false)
  const baseConfig = shallowRef<BaseConfig | null>(null)

  /* for fun only */
  const tempAkariSubscriptionInfo = shallowRef({
    current: 'basic',
    shown: false
  })

  const preferredColorScheme = usePreferredColorScheme()

  const colorTheme = computed(() => {
    if (settings.theme === 'default') {
      return preferredColorScheme.value === 'dark' ? 'dark' : 'light'
    }

    return settings.theme
  })

  return {
    settings,
    isAdministrator,
    disableHardwareAcceleration,
    version,
    isRabiVersion,
    baseConfig,

    colorTheme,

    tempAkariSubscriptionInfo
  }
})
