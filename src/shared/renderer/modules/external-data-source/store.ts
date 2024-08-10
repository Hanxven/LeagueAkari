import { GtimgHeroListJs, Hero } from '@shared/external-data-source/gtimg'
import { ChampBalanceMapV1 } from '@shared/external-data-source/normalized/champ-balance'
import { AvailableServersMap } from '@shared/external-data-source/sgp'
import { defineStore } from 'pinia'
import { computed, shallowRef, watchEffect } from 'vue'

export const useExternalDataSourceStore = defineStore('module:external-data-source', () => {
  const balanceData = shallowRef<{
    dataSource: string
    map: ChampBalanceMapV1
    updateAt: Date
  } | null>(null)

  const heroList = shallowRef<GtimgHeroListJs | null>(null)

  // id 用 string 表示，确实有点...
  // 谁教你用 hero 表示 champion 的？
  const heroListMap = computed(() => {
    if (!heroList.value) return {}

    try {
      return heroList.value.hero.reduce(
        (acc, hero) => {
          acc[Number(hero.heroId)] = hero
          return acc
        },
        {} as Record<string, Hero>
      )
    } catch (error) {
      return {}
    }
  })

  watchEffect(() => {
    console.log('heroListMap', heroListMap.value)
  })

  const sgpAvailability = shallowRef({
    currentRegion: '',
    currentRsoPlatform: '',
    currentSgpServerSupported: false,
    currentSgpServerId: '',
    supportedSgpServers: {
      servers: {},
      groups: []
    } as AvailableServersMap
  })

  return {
    balanceData,
    sgpAvailability,
    heroList,
    heroListMap
  }
})
