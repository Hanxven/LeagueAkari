import { Ballot } from '@shared/types/lcu/honorV2'
import { makeAutoObservable, observable } from 'mobx'

export class HonorState {
  ballot: Ballot | null

  setBallot(b: Ballot | null) {
    this.ballot = b
  }

  constructor() {
    makeAutoObservable(this, {
      ballot: observable.struct
    })
  }
}
