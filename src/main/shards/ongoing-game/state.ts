import { makeAutoObservable } from 'mobx'

export class OngoingGameState {
  constructor() {
    makeAutoObservable(this)
  }
}
