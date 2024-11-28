import { makeAutoObservable } from 'mobx'

export class AutoRuneState {
  constructor() {
    makeAutoObservable(this)
  }
}

export class AutoRuneSettings {
  /**
   * 自动符文源的
   */
  source: 'opgg' | 'lcu'

  setSource(source: 'opgg' | 'lcu') {
    this.source = source
  }

  constructor() {
    makeAutoObservable(this)
  }
}
