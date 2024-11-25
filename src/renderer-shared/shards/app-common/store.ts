import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

interface BaseConfig {
  disableHardwareAcceleration?: boolean
}

export const useAppCommonStore = defineStore('shard:app-common-renderer', () => {
  const settings = shallowReactive({
    showFreeSoftwareDeclaration: false,
    isInKyokoMode: false,
    locale: 'zh-CN'
  })

  const version = ref('0.0.0')
  const isAdministrator = ref(false)
  const disableHardwareAcceleration = ref(false)
  const baseConfig = shallowRef<BaseConfig | null>(null)

  /* for fun only */
  const tempAkariSubscriptionInfo = shallowRef({
    current: 'basic',
    shown: false
  })

  return {
    settings,
    isAdministrator,
    disableHardwareAcceleration,
    version,
    baseConfig,

    tempAkariSubscriptionInfo
  }
})
