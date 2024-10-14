import { makeAutoObservable } from 'mobx'

export class CommonState {
  isAdministrator: boolean = false

  setAdministrator(s: boolean) {
    this.isAdministrator = s
  }

  constructor() {
    makeAutoObservable(this)
  }
}
