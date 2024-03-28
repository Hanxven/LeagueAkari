import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import {
  Augment,
  ChampionSimple,
  Item,
  Perk,
  Perkstyles,
  Queue,
  SummonerSpell
} from '@shared/types/lcu/game-data'

export const useGameDataStore = defineStore('game-data', () => {
  const summonerSpells = shallowRef<Record<number, SummonerSpell>>({})
  const items = shallowRef<Record<number | string, Item>>({})
  const queues = shallowRef<Record<number | string, Queue>>({})
  const perks = shallowRef<Record<number | string, Perk>>({})
  const perkstyles = shallowRef<Record<number | string, Perkstyles['styles'][number]>>({})
  const augments = shallowRef<Record<number | string, Augment>>({})
  const champions = shallowRef<Record<number | string, ChampionSimple>>({})

  return {
    summonerSpells,
    items,
    queues,
    perks,
    perkstyles,
    augments,
    champions
  }
})
