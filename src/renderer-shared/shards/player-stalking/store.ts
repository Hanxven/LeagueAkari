import { SpectatorData } from '@shared/data-sources/sgp/types'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

// copied from main shard
export interface StalkedPlayer {
  enabled: boolean
  puuid: string
  sgpServerId: string
}

// copied from main shard
export interface PlayerTracking {
  summoner: SummonerInfo | null
  spectator: SpectatorData | null
  lastUpdated: number
}

export const usePlayerStalkingStore = defineStore('shard:player-stalking-renderer', () => {
  const settings = shallowReactive({
    enabled: false,
    playersToStalk: [] as StalkedPlayer[],
    pollIntervalSeconds: 60 // 未实装, 但默认为 60 秒
  })

  const tracking = shallowRef<Record<string, PlayerTracking>>({})

  return {
    settings,

    tracking
  }
})
