import { ChampBalanceMapV1 } from '@shared/external-data-source/normalized/champ-balance'
import { AvailableServersMap } from '@shared/external-data-source/sgp'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useExternalDataSourceStore = defineStore('module:external-data-source', () => {
  const balanceData = shallowRef<{
    name: string
    map: ChampBalanceMapV1
    updateAt: Date
  } | null>(null)

  const sgpAvailability = shallowRef({
    currentRegion: '',
    currentRegionSupported: false,
    supportedServers: {} as AvailableServersMap
  })

  return {
    balanceData,
    sgpAvailability
  }
})
