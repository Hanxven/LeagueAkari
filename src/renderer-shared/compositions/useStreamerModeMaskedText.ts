import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { getNameFromYuriyuri } from '@shared/utils/yuriyuri-names'
import { useTranslation } from 'i18next-vue'

export function useStreamerModeMaskedText() {
  const app = useAppCommonStore()
  const { t } = useTranslation()

  const summonerName = (seed: string, index: number) => {
    if (app.settings.streamerModeUseAkariStyledName) {
      return getNameFromYuriyuri(seed, app.settings.locale)
    }

    return t('common.summonerPlaceholder', { index: index + 1 })
  }

  /**
   * 将敏感文本替换为星号 (或自定义的字符串)
   * @param sensitiveText
   * @param replacer
   * @returns
   */
  const masked = (sensitiveText: string, replacer?: ((text: string) => string) | string) => {
    if (app.settings.streamerMode) {
      if (typeof replacer === 'function') {
        return replacer(sensitiveText)
      } else if (typeof replacer === 'string') {
        return replacer
      } else {
        return '●●●●●●'
      }
    } else {
      return sensitiveText
    }
  }

  return { masked, summonerName }
}
