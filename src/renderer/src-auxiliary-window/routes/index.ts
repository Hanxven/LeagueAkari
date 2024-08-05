import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      component: () => import('@auxiliary-window/views/Placeholder.vue')
    },
    {
      path: '/champ-select',
      name: 'champ-select',
      component: () => import('@auxiliary-window/views/ChampSelect.vue')
    },
    {
      path: '/lounge',
      name: 'lounge',
      component: () => import('@auxiliary-window/views/Lounge.vue')
    },
    {
      path: '/opgg',
      name: 'opgg',
      component: () => import('@auxiliary-window/views/Test.vue')
    }
  ]
})

export { router }
