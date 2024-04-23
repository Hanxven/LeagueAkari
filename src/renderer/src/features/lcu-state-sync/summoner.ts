import { SummonerInfo } from '@shared/types/lcu/summoner'
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useSummonerStore = defineStore('lcu:summoner', () => {
  const currentSummoner = shallowRef<SummonerInfo | null>(null)
  const newIdSystemEnabled = ref(false)

  return {
    me: currentSummoner,
    newIdSystemEnabled
  }
})
