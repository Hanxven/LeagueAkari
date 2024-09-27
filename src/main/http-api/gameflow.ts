import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { GameflowPhase, GameflowSession } from '@shared/types/lcu/gameflow'

export function getGameflowPhase() {
  return lcm.lcuRequest<GameflowPhase>({
    method: 'GET',
    url: '/lol-gameflow/v1/gameflow-phase'
  })
}

export function getGameflowSession() {
  return lcm.lcuRequest<GameflowSession>({
    method: 'GET',
    url: '/lol-gameflow/v1/session'
  })
}

export function earlyExit() {
  return lcm.lcuRequest({
    url: '/lol-gameflow/v1/early-exit',
    method: 'POST'
  })
}

// DEBUGGING
export function dodge() {
  return lcm.lcuRequest({
    url: '/lol-gameflow/v1/session/dodge',
    method: 'POST',
    data: {
      // JUST FOR EXAMPLE
      dodgeIds: [4014911518],
      phase: 'ChampSelect'
    }
  })
}

export function reconnect() {
  return lcm.lcuRequest({
    url: '/lol-gameflow/v1/reconnect',
    method: 'POST'
  })
}
