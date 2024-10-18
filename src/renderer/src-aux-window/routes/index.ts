import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      component: () => import('@aux-window/views/indicator/Placeholder.vue')
    },
    {
      path: '/indicator',
      name: 'indicator',
      component: () => import('@aux-window/views/indicator/Indicator.vue'),
      children: [
        {
          path: 'champ-select',
          name: 'champ-select',
          component: () => import('@aux-window/views/indicator/ChampSelect.vue')
        },
        {
          path: 'lounge',
          name: 'lounge',
          component: () => import('@aux-window/views/indicator/Lounge.vue')
        },
        {
          path: 'placeholder',
          name: 'placeholder',
          component: () => import('@aux-window/views/indicator/Placeholder.vue')
        }
      ]
    },
    {
      path: '/opgg',
      name: 'opgg',
      component: () => import('@aux-window/views/opgg/Opgg.vue')
    }
  ]
})

export { router }
