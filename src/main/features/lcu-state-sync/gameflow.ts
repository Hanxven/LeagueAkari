import { lcuConnectionState, lcuEventEmitter } from '@main/core/lcu-connection'
import { getGameflowPhase, getGameflowSession } from '@main/http-api/gameflow'
import { ipcStateSync } from '@main/utils/ipc'
import { GameflowPhase, GameflowSession } from '@shared/types/lcu/gameflow'
import { reaction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

class GameflowState {
  phase: GameflowPhase | null = null

  session: GameflowSession | null = null

  constructor() {
    makeAutoObservable(this, {
      phase: observable.struct,
      session: observable.struct
    })
  }

  setPhase(phase: GameflowPhase | null) {
    this.phase = phase
  }

  setSession(session: GameflowSession | null) {
    this.session = session
  }
}

export const gameflow = new GameflowState()

export function gameflowSync() {
  // 立即初始化
  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        gameflow.setPhase((await getGameflowPhase()).data)
      } else {
        gameflow.setPhase(null)
      }
    }
  )

  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          gameflow.setSession((await getGameflowSession()).data)
        } catch {
          gameflow.setSession(null)
        }
      } else {
        gameflow.setSession(null)
      }
    }
  )

  lcuEventEmitter.on('/lol-gameflow/v1/gameflow-phase', (event) => {
    gameflow.setPhase(event.data)
  })

  lcuEventEmitter.on('/lol-gameflow/v1/session', (event) => {
    gameflow.setSession(event.data)
  })

  ipcStateSync('lcu/gameflow/phase', () => gameflow.phase)
  ipcStateSync('lcu/gameflow/session', () => gameflow.session)
}
