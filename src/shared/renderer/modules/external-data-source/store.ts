import { ChampBalanceMapV1 } from '@shared/external-data-source/normalized/champ-balance'
import { AvailableServersMap } from '@shared/external-data-source/sgp'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useExternalDataSourceStore = defineStore('module:external-data-source', () => {
  const balanceData = shallowRef<{
    dataSource: string
    map: ChampBalanceMapV1
    updateAt: Date
  } | null>(null)

  const sgpAvailability = shallowRef({
    currentRegion: '',
    currentRsoPlatform: '',
    currentSgpServerSupported: false,
    supportedSgpServers: {
      servers: {},
      groups: []
    } as AvailableServersMap
  })

  return {
    balanceData,
    sgpAvailability
  }
})
