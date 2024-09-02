import { SummonerInfo } from '@shared/types/lcu/summoner'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

export const useSummonerStore = defineStore('lcu:summoner', () => {
  const currentSummoner = shallowRef<SummonerInfo | null>(null)

  const newIdSystemEnabled = computed(() => Boolean(currentSummoner.value?.tagLine))

  return {
    me: currentSummoner,
    newIdSystemEnabled
  }
})
