import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { GameMapAsset } from '@shared/types/league-client/game-data'
import { readonly, shallowRef, watch } from 'vue'

export function useMapAssets() {
  const lcs = useLeagueClientStore()
  const lc = useInstance(LeagueClientRenderer)

  const data = shallowRef<GameMapAsset | null>(null)

  watch(
    () => lcs.isConnected,
    async (isConnected) => {
      if (isConnected) {
        data.value = (await lc.api.gameData.getMapAssets()).data
      } else {
        data.value = null
      }
    },
    { immediate: true }
  )

  return readonly(data)
}
