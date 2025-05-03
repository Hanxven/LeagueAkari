import 'reflect-metadata'

import '@renderer-shared/assets/css/base-styles.less'
import '@renderer-shared/assets/css/github-markdown.less'
import '@renderer-shared/assets/css/lol-view.less'
import { i18next } from '@renderer-shared/i18n'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import I18nextVue from 'i18next-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import NaiveUIProviderApp from './NaiveUIProviderApp.vue'
import './assets/css/styles.less'
import './assets/css/transition.less'
import { router } from './routes'
import { manager } from './shards'

try {
  dayjs.extend(relativeTime)
  dayjs.extend(duration)

  const app = createApp(NaiveUIProviderApp)
    .use(router)
    .use(createPinia())
    .use(I18nextVue, { i18next })
    .use(manager)
  await manager.setup()
  app.mount('#app')
} catch (error) {
  console.error('League Akari 无法正确加载：', error)
  alert(
    'League Akari 无法正确加载，请查看控制台以获取更多信息 / League Akari failed to load correctly, please check the console for more information'
  )
}
