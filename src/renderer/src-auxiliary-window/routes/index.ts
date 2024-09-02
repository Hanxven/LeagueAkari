import { auxiliaryWindowRendererModule as awm } from '@renderer-shared/modules/auxiliary-window'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      component: () => import('@auxiliary-window/views/indicator/Placeholder.vue')
    },
    {
      path: '/indicator',
      name: 'indicator',
      component: () => import('@auxiliary-window/views/indicator/Indicator.vue'),
      beforeEnter: () => {
        awm.setFunctionality('indicator')
      },
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
      beforeEnter: () => {
        awm.setFunctionality('opgg')
      },
      component: () => import('@auxiliary-window/views/opgg/Opgg.vue')
    }
  ]
})

export { router }
