import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import { isChampionNameMatch, isChampionNameMatchKeywords } from '@shared/utils/string-match'

export function useChampionNameMatch() {
  const eas = useExtraAssetsStore()

  const match = (pattern: string, label: string, value?: number) => {
    try {
      if (eas.heroListMap && value !== undefined) {
        const c = eas.heroListMap[value]

        if (c) {
          const keywords = c.keywords.split(',')
          return (
            isChampionNameMatchKeywords(pattern, [label, ...keywords]) ||
            value.toString().includes(pattern)
          )
        }
      }

      return (
        isChampionNameMatch(pattern, label) || Boolean(value && value.toString().includes(pattern))
      )
    } catch {
      return (
        isChampionNameMatch(pattern, label) || Boolean(value && value.toString().includes(pattern))
      )
    }
  }

  return { match }
}
