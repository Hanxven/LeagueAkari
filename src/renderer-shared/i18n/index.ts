import en from '@shared/i18n/en.yaml'
import zhCN from '@shared/i18n/zh-CN.yaml'
import i18next from 'i18next'

i18next.init({
  lng: 'en',
  fallbackLng: 'zh-CN',
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false
  },
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en }
  }
})

export { i18next }
