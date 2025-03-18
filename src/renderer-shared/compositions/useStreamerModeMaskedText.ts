import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'

export function useStreamerModeMaskedText() {
  const app = useAppCommonStore()

  /**
   * 将敏感文本替换为星号 (或自定义的字符串)
   * @param sensitiveText
   * @param replacer
   * @returns
   */
  const masked = (sensitiveText: string, replacer?: ((text: string) => string) | string) => {
    if (app.frontendSettings.streamerMode) {
      if (typeof replacer === 'function') {
        return replacer(sensitiveText)
      } else if (typeof replacer === 'string') {
        return replacer
      } else {
        return '******'
      }
    } else {
      return sensitiveText
    }
  }

  return { masked }
}
