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
      component: () => import('@renderer/views/Panel.vue'),
      children: [
        {
          name: 'match-history',
          path: '/match-history/:summonerId?',
          component: () => import('@renderer/views/match-history/MatchHistoryTabs.vue')
        },
        {
          name: 'ongoing-game',
          path: '/ongoing-game',
          component: () => import('@renderer/views/ongoing-game/OngoingGame.vue')
        },
        {
          name: 'toolkit',
          path: '/toolkit',
          component: () => import('@renderer/views/toolkit/Toolkit.vue')
        },
        {
          name: 'automation',
          path: '/automation',
          component: () => import('@renderer/views/automation/Automation.vue')
        }
      ]
    },
    {
      path: '/connecting',
      component: () => import('@renderer/views/Connecting.vue')
    }
  ]
})

export { router }
