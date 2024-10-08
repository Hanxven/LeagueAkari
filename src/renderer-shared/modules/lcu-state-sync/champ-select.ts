import { ChampSelectSession } from '@shared/types/lcu/champ-select'
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useChampSelectStore = defineStore('lcu:champ-select', () => {
  const session = shallowRef<ChampSelectSession | null>(null)

  // 当前英雄选择会话中可以选择的英雄列表，取决于自己是否拥有、或者是否是服务器热禁用
  const currentPickableChampionIds = shallowRef(new Set<number>())
  const currentBannableChampionIds = shallowRef(new Set<number>())
  const disabledChampionIds = shallowRef(new Set<number>())

  const currentChampion = ref<number | null>(null)

  return {
    session,
    currentPickableChampionIds,
    currentBannableChampionIds,
    disabledChampionIds,
    currentChampion
  }
})
