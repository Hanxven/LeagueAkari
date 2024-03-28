import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import { ChampSelectSession } from '@shared/types/lcu/champ-select'

export const useChampSelectStore = defineStore('champ-select', () => {
  const session = shallowRef<ChampSelectSession | null>(null)

  // 当前英雄选择会话中可以选择的英雄列表，取决于自己是否拥有、或者是否是服务器热禁用
  const currentPickableChampions = shallowRef(new Set<number>())
  const currentBannableChampions = shallowRef(new Set<number>())

  return {
    session,
    currentPickableChampions,
    currentBannableChampions
  }
})
