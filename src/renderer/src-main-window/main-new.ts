import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting'
import { AkariManager } from '@shared/akari-shard/manager'
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

dayjs.extend(relativeTime)
dayjs.extend(duration)

const app = createApp(NaiveUIProviderApp)
app.use(router)
app.use(createPinia())

const manager = new AkariManager()

app.provide('shard-manager', manager)

manager.use(
  LeagueClientRenderer,
  RiotClientRenderer,
  SettingUtilsRenderer,
  AkariIpcRenderer,
  PiniaMobxUtilsRenderer
)

try {
  await manager.setup()

  const logger = manager.getInstance('logger-renderer') as LoggerRenderer

  app.config.errorHandler = (err, instance, info) => {
    logger.error('Vue', err, instance, info)
    console.error('Vue Error:', err, instance, info)
  }
  app.mount('#app')
} catch (error) {
  console.error('League Akari 无法正确加载：', error)
} finally {
}
