import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      redirect: '/connecting'
    },
    {
      name: 'panel',
      path: '/panel',
      component: () => import('@main-window/views/Panel.vue'),
      children: [
        {
          name: 'match-history',
          path: '/match-history/:summonerId?',
          component: () => import('@main-window/views/match-history/MatchHistoryTabs.vue')
        },
        {
          name: 'ongoing-game',
          path: '/ongoing-game',
          component: () => import('@main-window/views/ongoing-game/OngoingGame.vue')
        },
        {
          name: 'toolkit',
          path: '/toolkit',
          component: () => import('@main-window/views/toolkit/Toolkit.vue')
        },
        {
          name: 'automation',
          path: '/automation',
          component: () => import('@main-window/views/automation/Automation.vue')
        }
      ]
    },
    {
      path: '/connecting',
      component: () => import('@main-window/views/Connecting.vue')
    }
  ]
})

export { router }
