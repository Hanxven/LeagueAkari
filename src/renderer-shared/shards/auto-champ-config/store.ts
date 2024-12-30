import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

// copied from main shard
export interface ChampionRunesConfig {
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

export interface SummonerSpellsConfig {
  spell1Id: number
  spell2Id: number
}

interface ChampionRunesV2Preset {
  [key: number]: Record<string, ChampionRunesConfig | null>
}

interface SummonerSpellsPreset {
  // 英雄 - 唯一 ID
  [key: number]: Record<string, SummonerSpellsConfig | null>
}

export const useAutoChampConfigStore = defineStore('shard:auto-champ-config-renderer', () => {
  const settings = shallowReactive({
    enabled: false,

    /**
     * 对应 LCU 数据 schemaVersion: 2
     */
    runesV2: {} as ChampionRunesV2Preset,

    summonerSpells: {} as SummonerSpellsPreset
  })

  return {
    settings
  }
})
