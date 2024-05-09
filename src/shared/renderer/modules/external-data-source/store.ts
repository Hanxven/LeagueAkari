import { ChampBalanceMapV1 } from '@shared/external-data-source/normalized/champ-balance'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useExternalDataSourceStore = defineStore('module:external-data-source', () => {
  const balance = shallowRef<{
    map: ChampBalanceMapV1
    updateAt: Date
  } | null>(null)

  return {
    balance
  }
})
