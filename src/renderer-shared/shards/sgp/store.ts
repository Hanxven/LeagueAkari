import { AvailableServersMap } from '@shared/data-sources/sgp'
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useSgpStore = defineStore('shard:sgp-renderer', () => {
  const availability = shallowRef<{
    region: string
    rsoPlatform: string
    sgpServerId: string
    serversSupported: {
      matchHistory: boolean
      common: boolean
    }
    sgpServers: AvailableServersMap
  }>({
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
    }
  })

  const isTokenReady = ref(false)

  return {
    availability,
    isTokenReady
  }
})
