import en from '@shared/i18n/en.yaml'
import zhCN from '@shared/i18n/zh-CN.yaml'
import i18next from 'i18next'

i18next.init({
  lng: 'zh-CN',
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN }
  }
})

export { i18next }
