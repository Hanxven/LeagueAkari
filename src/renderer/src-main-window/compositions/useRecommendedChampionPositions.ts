import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { RecommendPositions } from '@shared/types/league-client/perks'
import { computed, readonly, shallowRef, watch } from 'vue'

export function useRecommendedChampionPositions() {
  const lcs = useLeagueClientStore()
  const lc = useInstance(LeagueClientRenderer)

  const data = shallowRef<RecommendPositions | null>(null)

  watch(
    () => lcs.isConnected,
    async (isConnected) => {
      if (isConnected) {
        data.value = (await lc.api.perks.getRecommendedChampionPositions()).data
      } else {
        data.value = null
      }
    },
    { immediate: true }
  )

  const positionMap = computed(() => {
    if (!data.value) return null

    const map: Record<string, Set<number>> = {}
    for (const [championId, { recommendedPositions }] of Object.entries(data.value)) {
      for (const position of recommendedPositions) {
        if (!map[position]) {
          map[position] = new Set<number>()
        }
        map[position].add(Number(championId))
      }
    }
    return map
  })

  return {
    data: readonly(data),
    positionMap
  }
}
