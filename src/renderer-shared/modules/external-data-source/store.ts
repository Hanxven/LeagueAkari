import { GtimgHeroListJs, Hero } from '@shared/data-sources/gtimg'
import { ChampBalanceMapV1 } from '@shared/data-sources/normalized/champ-balance'
import { AvailableServersMap } from '@shared/data-sources/sgp'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

export const useExternalDataSourceStore = defineStore('module:data-sources', () => {
  const balanceData = shallowRef<{
    dataSource: string
    map: ChampBalanceMapV1
    updateAt: Date
  } | null>(null)

  const heroList = shallowRef<GtimgHeroListJs | null>(null)

  // id 用 string 表示，确实有点...
  const heroListMap = computed(() => {
    if (!heroList.value) return {}
    return heroList.value.hero.reduce(
      (acc, hero) => {
        acc[Number(hero.heroId)] = hero
        return acc
      },
      {} as Record<string, Hero>
    )
  })

  const sgpAvailability = shallowRef({
    region: '',
    rsoPlatform: '',
    sgpServerId: '',
    serversSupported: {
      matchHistory: false,
      common: false
    },
    sgpServers: {
      servers: {},
      tencentServerMatchHistoryInteroperability: [],
      tencentServerSpectatorInteroperability: [],
      tencentServerSummonerInteroperability: []
    } as AvailableServersMap
  })

  return {
    balanceData,
    sgpAvailability,
    heroList,
    heroListMap
  }
})
