import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { computed } from 'vue'

export function useTitleText(debugIdentifier = 'rabi') {
  const app = useAppCommonStore()

  const titleText = computed(() => {
    const isRabiVersion = app.version.includes(debugIdentifier)
    const rabiVersion = app.version.split('-')[1] || '?'

    if (app.settings.isInKyokoMode && isRabiVersion) {
      return `League Kyoko [${rabiVersion}]`
    }

    if (isRabiVersion) {
      return `League Akari [${rabiVersion}]`
    }

    if (app.settings.isInKyokoMode) {
      return 'League Kyoko'
    }

    return 'League Akari'
  })

  return {
    title: titleText
  }
}
