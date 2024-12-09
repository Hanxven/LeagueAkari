import { createPinia } from 'pinia'
import { createApp } from 'vue'
import I18nextVue from 'i18next-vue'
import { i18next } from '@renderer-shared/i18n'

import App from './App.vue'
import "./style.css";
import { manager } from './shards'

try {
  const app = createApp(App)
    .use(createPinia())
    .use(I18nextVue, { i18next })
    .use(manager)
    await manager.setup()
  app.mount('#app')
} catch (error) {
  console.error('League Akari 无法正确加载：', error)
}
