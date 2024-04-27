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
      path: '/ready-check',
      name: 'ready-check',
      component: () => import('@auxiliary-window/views/Lounge.vue')
    }
  ]
})

export { router }
