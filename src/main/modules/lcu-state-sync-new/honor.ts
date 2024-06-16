import { BallotLegacy } from '@shared/types/lcu/honorV2'
import { makeAutoObservable, observable } from 'mobx'

export class HonorState {
  ballot: BallotLegacy | null

  setBallot(b: BallotLegacy | null) {
    this.ballot = b
  }

  constructor() {
    makeAutoObservable(this, {
      ballot: observable.struct
    })
  }
}
