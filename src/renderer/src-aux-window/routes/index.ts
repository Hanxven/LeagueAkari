import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      redirect: { name: 'indicator' }
    },
    {
      path: '/indicator',
      name: 'indicator',
      component: () => import('@aux-window/views/indicator/Indicator.vue')
    },
    {
      path: '/opgg',
      name: 'opgg',
      component: () => import('@aux-window/views/opgg/Opgg.vue')
    }
  ]
})

export { router }
