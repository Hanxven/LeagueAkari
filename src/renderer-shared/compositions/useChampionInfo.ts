import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'

export function useChampionInfo() {
  const lcs = useLeagueClientStore()
  const { t } = useTranslation()

  const name = (id: number) => {
    if (id === -3) {
      return t('champions.bravery')
    }

    return lcs.gameData.champions[id]?.name || lcs.gameData.champions[-1]?.name
  }

  return {
    name
  }
}
