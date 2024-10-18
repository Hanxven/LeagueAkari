import { BalanceType } from '@shared/data-sources/fandom'
import { GtimgHeroListJs, Hero } from '@shared/data-sources/gtimg'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export const useExtraAssetsStore = defineStore('shard:extra-assets-renderer', () => {
  const gtimg = shallowReactive({
    heroList: null as GtimgHeroListJs | null
  })

  const fandom = shallowReactive({
    balance: null as Record<string, BalanceType> | null
  })

  const heroListMap = computed(() => {
    if (!gtimg.heroList) return {}

    try {
      return gtimg.heroList.hero.reduce(
        (acc, hero) => {
          acc[Number(hero.heroId)] = hero
          return acc
        },
        {} as Record<string, Hero>
      )
    } catch {
      return {}
    }
  })

  return {
    gtimg,
    fandom,

    // computed
    heroListMap
  }
})
