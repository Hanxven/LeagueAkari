import { createRouter, createWebHashHistory } from 'vue-router'

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
          path: '/match-history/:puuid?',
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
          redirect: { name: 'in-process' },
          component: () => import('@main-window/views/toolkit/Toolkit.vue'),
          children: [
            {
              name: 'toolkit-in-process',
              path: 'in-process',
              component: () => import('@main-window/views/toolkit/in-process/InProcess.vue')
            },
            {
              name: 'toolkit-lobby',
              path: 'lobby',
              component: () => import('@main-window/views/toolkit/lobby/Lobby.vue')
            },
            {
              name: 'toolkit-client',
              path: 'client',
              component: () => import('@main-window/views/toolkit/client/Client.vue')
            },
            {
              name: 'toolkit-misc',
              path: 'misc',
              component: () => import('@main-window/views/toolkit/misc/Misc.vue')
            }
          ]
        },
        {
          name: 'automation',
          path: '/automation',
          redirect: { name: 'automation-auto-gameflow' },
          component: () => import('@main-window/views/automation/Automation.vue'),
          children: [
            {
              name: 'automation-auto-gameflow',
              path: 'auto-gameflow',
              component: () => import('@main-window/views/automation/AutoGameflow.vue')
            },
            {
              name: 'automation-auto-select',
              path: 'auto-select',
              component: () => import('@main-window/views/automation/AutoSelect.vue')
            },
            {
              name: 'automation-misc',
              path: 'misc',
              component: () => import('@main-window/views/automation/AutoMisc.vue')
            }
          ]
        }
      ]
    }
  ]
})

export { router }
