import { GameflowPhase, GameflowSession } from '@shared/types/league-client/gameflow'
import { makeAutoObservable, observable } from 'mobx'

export class GameflowState {
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
