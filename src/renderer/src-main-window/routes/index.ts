import { createRouter, createWebHashHistory } from 'vue-router'

// console.log(import.meta.env.BASE_URL)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      redirect: { name: 'match-history' }
    },
    {
      name: 'panel',
      path: '/panel',
      component: () => import('@main-window/views/Panel.vue'),
      children: [
        {
          name: 'match-history',
          path: '/match-history/:sgpServerId?/:puuid?',
          component: () => import('@main-window/views/match-history/MatchHistoryTabs.vue')
        },
        {
          name: 'ongoing-game',
          path: '/ongoing-game/:mode?',
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
        },
        {
          name: 'test',
          path: 'test',
          component: () => import('@main-window/views/test/Test.vue')
        }
      ]
    }
  ]
})

export { router }
