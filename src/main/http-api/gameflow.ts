import { GameflowPhase, GameflowSession } from '@shared/types/lcu/gameflow'

import { request } from './common'

export function getGameflowPhase() {
  return request<GameflowPhase>({
    method: 'GET',
    url: '/lol-gameflow/v1/gameflow-phase'
  })
}

export function getGameflowSession() {
  return request<GameflowSession>({
    method: 'GET',
    url: '/lol-gameflow/v1/session'
  })
}

export function earlyExit() {
  return request({
    url: '/lol-gameflow/v1/early-exit',
    method: 'POST'
  })
}

// DEBUGGING
export function dodge() {
  return request({
    url: '/lol-gameflow/v1/session/dodge',
    method: 'POST',
    data: {
      // JUST FOR EXAMPLE
      dodgeIds: [4014911518],
      phase: 'ChampSelect'
    }
  })
}
