import { makeAutoObservable } from 'mobx'

class AutoAcceptSettings {
  enabled: boolean = false
  delaySeconds: number = 0

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setDelaySeconds(seconds: number) {
    this.delaySeconds = seconds
  }

  constructor() {
    makeAutoObservable(this)
  }
}

class AutoAcceptState {
  /**
   * 即将进行自动接受操作
   */
  willAutoAccept = false

  /**
   * 即将进行的自动接受操作将在指定时间戳完成
   */
  willAutoAcceptAt = -1

  settings = new AutoAcceptSettings()

  constructor() {
    makeAutoObservable(this)
  }

  setAt(at: number) {
    this.willAutoAccept = true
    this.willAutoAcceptAt = at
  }

  clear() {
    this.willAutoAccept = false
    this.willAutoAcceptAt = -1
  }
}

export const autoAcceptState = new AutoAcceptState()
