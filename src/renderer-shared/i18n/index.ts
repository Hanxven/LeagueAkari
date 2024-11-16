import en from '@shared/i18n/en.yaml'
import zhCN from '@shared/i18n/zh-cn.yaml'
import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  locale: 'zh-cn',
  messages: { 'zh-cn': zhCN, en },
  legacy: false,
  warnHtmlMessage: false
})
