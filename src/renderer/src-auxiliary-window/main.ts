import { appRendererModule as am } from '@renderer-shared/modules/app'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { createPinia } from 'pinia'
import 'vfonts/Lato.css'
import { createApp } from 'vue'

import NaiveUIProviderApp from './NaiveUIProviderApp.vue'
import './assets/css/styles.less'
import { setupLeagueAkariRendererModules } from './modules'
import { router } from './routes'

dayjs.extend(relativeTime)
dayjs.extend(duration)

const app = createApp(NaiveUIProviderApp)
app.use(router)
app.use(createPinia())

try {
  await setupLeagueAkariRendererModules()
} catch (error) {
  console.error('League Akari 无法正确加载：', error)
} finally {
  app.config.errorHandler = (err, instance, info) => {
    am.logger.error(info, err)
    console.error('Vue Error:', err, instance, info)
  }
  app.mount('#app')
}
