import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { createPinia } from 'pinia'
import 'vfonts/Lato.css'
import { createApp } from 'vue'

import NaiveUIProviderApp from './NaiveUIProviderApp.vue'
import './assets/css/styles.less'
import { router } from './routes'
import { manager } from './shards'

try {
  dayjs.extend(relativeTime)
  dayjs.extend(duration)

  const app = createApp(NaiveUIProviderApp).use(router).use(createPinia()).use(manager)
  await manager.setup()
  app.mount('#app')
} catch (error) {
  console.error('League Akari 无法正确加载：', error)
}