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
      component: () => import('@auxiliary-window/views/indicator/Indicator.vue'),
      children: [
        {
          path: 'champ-select',
          name: 'champ-select',
          component: () => import('@auxiliary-window/views/indicator/ChampSelect.vue')
        },
        {
          path: 'lounge',
          name: 'lounge',
          component: () => import('@auxiliary-window/views/indicator/Lounge.vue')
        },
        {
          path: 'placeholder',
          name: 'placeholder',
          component: () => import('@auxiliary-window/views/indicator/Placeholder.vue')
        }
      ]
    },
    {
      path: '/opgg',
      name: 'opgg',
      component: () => import('@auxiliary-window/views/opgg/Opgg.vue')
    }
  ]
})

export { router }
