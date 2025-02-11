import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      component: () => import('@opgg-window/views/Opgg.vue')
    }
  ]
})

export { router }
